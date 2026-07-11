import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { AppState, Linking, View } from "react-native";
import { useRouter } from "expo-router";
import { useExpoPushNotifications } from "@knocklabs/expo";
import * as Notifications from "expo-notifications";
import { onlineManager } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { appConfig } from "@/lib/app-config";
import { getRegisteredPushDevice, setRegisteredPushDevice } from "@/lib/push-token-store";
import { usePushDeviceCleanup } from "./use-push-device-cleanup";

type PushRegistrationContextValue = {
  permission: Notifications.PermissionStatus | null;
  registrationFailed: boolean;
  registering: boolean;
  register: () => Promise<void>;
};

const PushRegistrationContext = createContext<PushRegistrationContextValue | null>(null);
const ReleasePushIdentityContext = createContext<() => Promise<void>>(() => Promise.resolve());

export const useReleasePushIdentity = () => useContext(ReleasePushIdentityContext);

export const PushNotificationRegistration = () => {
  const registration = useContext(PushRegistrationContext);
  if (registration === null) return null;
  const { permission, register, registrationFailed, registering } = registration;

  if (
    permission === null ||
    (permission === Notifications.PermissionStatus.GRANTED && !registrationFailed)
  )
    return null;

  const denied = permission === Notifications.PermissionStatus.DENIED;
  const retryRegistration =
    permission === Notifications.PermissionStatus.GRANTED && registrationFailed;

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
        onPress={() => {
          const action = denied ? Linking.openSettings() : register();
          action.catch(() => toast.error("Could not enable notifications. Please try again."));
        }}
        loading={registering}
      >
        {denied ? "Open Settings" : retryRegistration ? "Retry" : "Enable notifications"}
      </Button>
    </View>
  );
};

export const PushNotificationCoordinator = ({
  children,
  pushCleanupCapability,
  userId,
}: {
  children: ReactElement;
  pushCleanupCapability: string;
  userId: string;
}) => {
  const router = useRouter();
  const {
    expoPushToken,
    onNotificationTapped,
    registerForPushNotifications,
    registerPushTokenToChannel,
  } = useExpoPushNotifications();
  const channelId = appConfig.knockExpoChannelId;
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [registrationFailed, setRegistrationFailed] = useState(false);
  const [registering, setRegistering] = useState(false);
  const cleanupStoredDevice = usePushDeviceCleanup();

  const register = useCallback(async () => {
    if (channelId === undefined) return;

    const previousDevice = getRegisteredPushDevice();
    // Already registered this exact device for this user this session —
    // skip the Knock channel PUT and keychain writes on every foreground.
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
        await cleanupStoredDevice(previousDevice);
        await Notifications.unregisterForNotificationsAsync();
      }

      const token = await registerForPushNotifications();
      if (token === null) {
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(status);
        setRegistrationFailed(status === Notifications.PermissionStatus.GRANTED);
        return;
      }

      setRegisteredPushDevice({ cleanupCapability: pushCleanupCapability, token, userId });
      await registerPushTokenToChannel(token, channelId);
      setPermission(Notifications.PermissionStatus.GRANTED);
      setRegistrationFailed(false);
    } catch (error) {
      setRegistrationFailed(true);
      throw error;
    } finally {
      setRegistering(false);
    }
  }, [
    channelId,
    cleanupStoredDevice,
    expoPushToken,
    pushCleanupCapability,
    registerForPushNotifications,
    registerPushTokenToChannel,
    userId,
  ]);

  useEffect(() => {
    const refreshPermission = () =>
      Notifications.getPermissionsAsync()
        .then(async ({ status }) => {
          setPermission(status);
          if (status === Notifications.PermissionStatus.GRANTED) await register();
          return undefined;
        })
        .catch(() => setRegistrationFailed(true));

    refreshPermission().catch(() => undefined);
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refreshPermission().catch(() => undefined);
    });
    const onlineSubscription = onlineManager.subscribe((online) => {
      if (online) refreshPermission().catch(() => undefined);
    });
    return () => {
      subscription.remove();
      onlineSubscription();
    };
  }, [register]);

  const releasePushIdentity = useCallback(async () => {
    const storedDevice = getRegisteredPushDevice();
    const token = expoPushToken ?? (storedDevice?.userId === userId ? storedDevice.token : null);
    if (token === null) return;

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
    () => ({ permission, register, registrationFailed, registering }),
    [permission, register, registrationFailed, registering],
  );

  useEffect(() => {
    let disposed = false;

    const openNotification = (response: Notifications.NotificationResponse) => {
      const postId = response.notification.request.content.data?.parentPostId;
      if (typeof postId === "string" && postId.length > 0) {
        router.push({ pathname: "/posts/[post-id]", params: { "post-id": postId } });
      }
    };

    onNotificationTapped(openNotification);
    Notifications.getLastNotificationResponseAsync()
      .then(async (response) => {
        if (disposed || response === null) return undefined;
        openNotification(response);
        await Notifications.clearLastNotificationResponseAsync();
        return undefined;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      onNotificationTapped(() => undefined);
    };
  }, [onNotificationTapped, router]);

  return (
    <ReleasePushIdentityContext.Provider value={releasePushIdentity}>
      <PushRegistrationContext.Provider value={registrationContext}>
        {children}
      </PushRegistrationContext.Provider>
    </ReleasePushIdentityContext.Provider>
  );
};
