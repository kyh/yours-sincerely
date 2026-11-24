import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppState, Linking, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { notificationTargetData } from "@repo/contract/notification/notification-schema";
import type { PushPlatform } from "@repo/contract/push/push-schema";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { onlineManager, useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/api";
import { appConfig } from "@/lib/app-config";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { resolveNotificationTarget } from "./notification-target";
import {
  deleteRegisteredPushDevice,
  getRegisteredPushDevice,
  setRegisteredPushDevice,
} from "./push-token-store";
import { refreshNotifications } from "@/lib/query-policies";
import { createPushSession, patchPushSession } from "./push-session";
import { usePushDeviceCleanup } from "./use-push-device-cleanup";

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

const ANDROID_CHANNEL_ID = "default";

const pushPlatform = Platform.select<PushPlatform>({ android: "android", ios: "ios" });

const acquireExpoPushToken = async () => {
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
    <View className="bg-card border-border mb-3 gap-3 rounded-xl border p-4">
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

interface PushIdentity {
  pushCleanupCapability: string;
  userId: string;
}

export const PushNotificationCoordinator = ({
  children,
  identity,
}: {
  children: ReactNode;
  identity: PushIdentity | null;
}) => {
  const router = useRouter();
  const userId = identity?.userId ?? null;
  const pushCleanupCapability = identity?.pushCleanupCapability ?? null;
  const [session, setSession] = useState(() => createPushSession(userId));

  if (session.userId !== userId) {
    setSession(createPushSession(userId));
  }

  const { expoPushToken, permission, registrationFailed, registering } = session;
  const cleanupStoredDevice = usePushDeviceCleanup();

  const { mutateAsync: registerPushToken } = useMutation(
    orpc.push.register.mutationOptions({ networkMode: "always" }),
  );

  const register = useCallback(async () => {
    if (userId === null || pushCleanupCapability === null) {
      return;
    }

    const previousDevice = getRegisteredPushDevice();

    if (
      expoPushToken !== null &&
      previousDevice !== null &&
      previousDevice.userId === userId &&
      previousDevice.token === expoPushToken &&
      previousDevice.cleanupCapability === pushCleanupCapability
    ) {
      setSession(
        patchPushSession(userId, {
          permission: Notifications.PermissionStatus.GRANTED,
          registrationFailed: false,
        }),
      );

      return;
    }

    setSession(patchPushSession(userId, { registering: true }));

    try {
      if (previousDevice !== null && previousDevice.userId !== userId) {
        await cleanupStoredDevice(previousDevice).catch(() => deleteRegisteredPushDevice());
      }

      const acquired = await acquireExpoPushToken();

      if (acquired === null) {
        const { status } = await Notifications.getPermissionsAsync();
        setSession(
          patchPushSession(userId, {
            permission: status,
            registrationFailed: status === Notifications.PermissionStatus.GRANTED,
          }),
        );
      } else {
        await registerPushToken(acquired);
        setRegisteredPushDevice({
          cleanupCapability: pushCleanupCapability,
          token: acquired.token,
          userId,
        });
        setSession(
          patchPushSession(userId, {
            expoPushToken: acquired.token,
            permission: Notifications.PermissionStatus.GRANTED,
            registrationFailed: false,
          }),
        );
      }
    } catch (error) {
      setSession(patchPushSession(userId, { registering: false, registrationFailed: true }));
      throw error;
    }

    setSession(patchPushSession(userId, { registering: false }));
  }, [cleanupStoredDevice, expoPushToken, pushCleanupCapability, registerPushToken, userId]);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    const refreshPermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setSession(patchPushSession(userId, { permission: status }));

        if (status === Notifications.PermissionStatus.GRANTED) {
          await register();
        }
      } catch {
        setSession(patchPushSession(userId, { registrationFailed: true }));
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
  }, [register, userId]);

  const releasePushIdentity = useCallback(async () => {
    if (userId === null || pushCleanupCapability === null) {
      return;
    }

    const storedDevice = getRegisteredPushDevice();
    const token = expoPushToken ?? (storedDevice?.userId === userId ? storedDevice.token : null);

    if (token === null) {
      return;
    }

    const device =
      storedDevice?.userId === userId
        ? storedDevice
        : { cleanupCapability: pushCleanupCapability, token, userId };

    await ignoreRejection(cleanupStoredDevice(device));
    await ignoreRejection(Notifications.unregisterForNotificationsAsync());
  }, [cleanupStoredDevice, expoPushToken, pushCleanupCapability, userId]);

  const registrationContext = useMemo(
    () => (userId === null ? null : { permission, register, registering, registrationFailed }),
    [permission, register, registrationFailed, registering, userId],
  );

  useEffect(() => {
    if (userId === null) {
      return;
    }

    const openNotification = (response: Notifications.NotificationResponse) => {
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

    const launchResponse = Notifications.getLastNotificationResponse();

    if (launchResponse !== null) {
      openNotification(launchResponse);
    }

    return () => {
      received.remove();
      responded.remove();
    };
  }, [router, userId]);

  return (
    <ReleasePushIdentityContext.Provider value={releasePushIdentity}>
      <PushRegistrationContext.Provider value={registrationContext}>
        {children}
      </PushRegistrationContext.Provider>
    </ReleasePushIdentityContext.Provider>
  );
};
