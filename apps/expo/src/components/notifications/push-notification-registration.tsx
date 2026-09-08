import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppState, Linking, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { notificationTargetData } from "@repo/contracts/notifications";
import type { PushPlatform } from "@repo/contracts/notifications";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { onlineManager, useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/api";
import { appConfig } from "@/lib/app-config";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { resolveNotificationTarget } from "@/lib/notification-target";
import {
  deleteRegisteredPushDevice,
  getRegisteredPushDevice,
  setRegisteredPushDevice,
} from "@/lib/push-token-store";
import { refreshNotifications } from "@/lib/query-policies";
import { usePushDeviceCleanup } from "./use-push-device-cleanup";

// Foreground pushes show as a banner only: the tab dot is the badge, and a
// reply is not worth a sound.
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

/** Expo's push service delivers to this channel when a message names none. */
const ANDROID_CHANNEL_ID = "default";

const pushPlatform = Platform.select<PushPlatform>({ android: "android", ios: "ios" });

interface AcquiredPushToken {
  token: string;
  platform: PushPlatform;
}

/** Null when this device cannot hold a token: simulators and unsupported
    platforms never prompt, a refused permission ends here, and a failed
    token fetch is reported through the permission state, not thrown. */
const acquireExpoPushToken = async (): Promise<AcquiredPushToken | null> => {
  if (!Device.isDevice || pushPlatform === undefined) {
    return null;
  }

  if (pushPlatform === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: "Replies",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const { status } =
    current.status === Notifications.PermissionStatus.GRANTED
      ? current
      : await Notifications.requestPermissionsAsync();
  if (status !== Notifications.PermissionStatus.GRANTED) {
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: appConfig.easProjectId,
    });
    return { platform: pushPlatform, token: data };
  } catch (error) {
    if (__DEV__) {
      console.error("[push] Could not fetch an Expo push token", error);
    }
    return null;
  }
};

interface PushRegistrationContextValue {
  permission: Notifications.PermissionStatus | null;
  registrationFailed: boolean;
  registering: boolean;
  register: () => Promise<void>;
}

const PushRegistrationContext = createContext<PushRegistrationContextValue | null>(null);
const ReleasePushIdentityContext = createContext<() => Promise<void>>(() => Promise.resolve());

export const useReleasePushIdentity = () => useContext(ReleasePushIdentityContext);

export const PushNotificationRegistration = () => {
  const registration = useContext(PushRegistrationContext);
  if (registration === null) {
    return null;
  }
  const { permission, register, registrationFailed, registering } = registration;

  if (
    permission === null ||
    (permission === Notifications.PermissionStatus.GRANTED && !registrationFailed)
  ) {
    return null;
  }

  const denied = permission === Notifications.PermissionStatus.DENIED;
  const retryRegistration =
    permission === Notifications.PermissionStatus.GRANTED && registrationFailed;
  const registerLabel = retryRegistration ? "Retry" : "Enable notifications";

  return (
    <View className="bg-card border-border mx-5 mb-3 gap-3 rounded-xl border p-4">
      <View className="gap-1">
        <Text className="font-semibold">Never miss a reply</Text>
        <Text className="text-muted-foreground text-sm">
          {retryRegistration
            ? "Notifications are allowed, but this device still needs to register."
            : "Get a quiet notification when someone responds to your letter."}
        </Text>
      </View>
      <Button
        size="sm"
        variant="outline"
        onPress={async () => {
          try {
            await (denied ? Linking.openSettings() : register());
          } catch {
            toast.error("Could not enable notifications. Please try again.");
          }
        }}
        loading={registering}
      >
        {denied ? "Open Settings" : registerLabel}
      </Button>
    </View>
  );
};

export const PushNotificationCoordinator = ({
  children,
  pushCleanupCapability,
  userId,
}: {
  children: ReactNode;
  pushCleanupCapability: string;
  userId: string;
}) => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [registrationFailed, setRegistrationFailed] = useState(false);
  const [registering, setRegistering] = useState(false);
  const cleanupStoredDevice = usePushDeviceCleanup();
  // Nothing queries push tokens, so there is no cache to invalidate.
  const { mutateAsync: registerPushToken } = useMutation(
    orpc.push.register.mutationOptions({ networkMode: "always" }),
  );

  const register = useCallback(async () => {
    const previousDevice = getRegisteredPushDevice();
    // Already registered this exact device for this user this session —
    // skip the server upsert and keychain writes on every foreground.
    if (
      expoPushToken !== null &&
      previousDevice !== null &&
      previousDevice.userId === userId &&
      previousDevice.token === expoPushToken &&
      previousDevice.cleanupCapability === pushCleanupCapability
    ) {
      setPermission(Notifications.PermissionStatus.GRANTED);
      setRegistrationFailed(false);
      return;
    }

    setRegistering(true);
    try {
      if (previousDevice !== null && previousDevice.userId !== userId) {
        // Best-effort: `push.register` moves the token to this account either
        // way, and the old account's capability may have expired since it
        // signed out — that must not lock this account out of push.
        await cleanupStoredDevice(previousDevice).catch(() => deleteRegisteredPushDevice());
      }

      const acquired = await acquireExpoPushToken();
      if (acquired === null) {
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(status);
        setRegistrationFailed(status === Notifications.PermissionStatus.GRANTED);
      } else {
        // The server row IS the registration: remember it locally only once it
        // exists, or a failed upsert is skipped as "already registered" forever.
        await registerPushToken(acquired);
        setRegisteredPushDevice({
          cleanupCapability: pushCleanupCapability,
          token: acquired.token,
          userId,
        });
        setExpoPushToken(acquired.token);
        setPermission(Notifications.PermissionStatus.GRANTED);
        setRegistrationFailed(false);
      }
    } catch (error) {
      setRegistrationFailed(true);
      setRegistering(false);
      throw error;
    }
    setRegistering(false);
  }, [cleanupStoredDevice, expoPushToken, pushCleanupCapability, registerPushToken, userId]);

  useEffect(() => {
    const refreshPermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(status);
        if (status === Notifications.PermissionStatus.GRANTED) {
          await register();
        }
      } catch {
        setRegistrationFailed(true);
      }
    };

    void refreshPermission();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        void refreshPermission();
      }
    });
    const onlineSubscription = onlineManager.subscribe((online) => {
      if (online) {
        void refreshPermission();
      }
    });
    return () => {
      subscription.remove();
      onlineSubscription();
    };
  }, [register]);

  const releasePushIdentity = useCallback(async () => {
    const storedDevice = getRegisteredPushDevice();
    const token = expoPushToken ?? (storedDevice?.userId === userId ? storedDevice.token : null);
    if (token === null) {
      return;
    }

    const device =
      storedDevice?.userId === userId
        ? storedDevice
        : { cleanupCapability: pushCleanupCapability, token, userId };
    try {
      await cleanupStoredDevice(device);
    } catch {
      // Offline: keep the capability so any later session can retry server cleanup.
    }

    try {
      await Notifications.unregisterForNotificationsAsync();
    } catch {
      // Remote cleanup is authoritative; native cleanup is defense in depth.
    }
  }, [cleanupStoredDevice, expoPushToken, pushCleanupCapability, userId]);
  const registrationContext = useMemo(
    () => ({ permission, register, registering, registrationFailed }),
    [permission, register, registrationFailed, registering],
  );

  useEffect(() => {
    const openNotification = (response: Notifications.NotificationResponse) => {
      // Native keeps the last tap until told otherwise, and this effect runs
      // again on every remount (sign-in, sign-out, password change): a tap
      // routed once must not route again from the mount-time read below.
      Notifications.clearLastNotificationResponse();
      const target = notificationTargetData.safeParse(response.notification.request.content.data);
      if (target.success) {
        router.push(resolveNotificationTarget(target.data));
      }
    };

    const received = Notifications.addNotificationReceivedListener(() => {
      void ignoreRejection(refreshNotifications());
    });
    const responded = Notifications.addNotificationResponseReceivedListener(openNotification);

    // A tap that cold-started the app happened before any listener existed.
    const launchResponse = Notifications.getLastNotificationResponse();
    if (launchResponse !== null) {
      openNotification(launchResponse);
    }

    return () => {
      received.remove();
      responded.remove();
    };
  }, [router]);

  return (
    <ReleasePushIdentityContext.Provider value={releasePushIdentity}>
      <PushRegistrationContext.Provider value={registrationContext}>
        {children}
      </PushRegistrationContext.Provider>
    </ReleasePushIdentityContext.Provider>
  );
};
