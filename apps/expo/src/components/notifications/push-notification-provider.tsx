import { useEffect, type ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { onlineManager } from "@tanstack/react-query";

import { getRegisteredPushDevice } from "@/lib/push-token-store";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { PushNotificationCoordinator } from "./push-notification-registration";
import { usePushDeviceCleanup } from "./use-push-device-cleanup";

/** Mounts push registration for the signed-in user. Signed out, it keeps
    retrying the server-side release of a device record that an offline
    sign-out could not clear. */
export const PushNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, pushCleanupCapability, isPending } = useWorkspaceUser();
  const cleanupPushDevice = usePushDeviceCleanup();

  useEffect(() => {
    if (isPending || user !== null || getRegisteredPushDevice() === null) return;

    const retryCleanup = () => {
      const device = getRegisteredPushDevice();
      if (device === null) return;

      cleanupPushDevice(device)
        .then(() => Notifications.unregisterForNotificationsAsync())
        .catch(() => undefined);
    };

    retryCleanup();
    const appStateSubscription = AppState.addEventListener("change", (status) => {
      if (status === "active") retryCleanup();
    });
    const onlineSubscription = onlineManager.subscribe((online) => {
      if (online) retryCleanup();
    });

    return () => {
      appStateSubscription.remove();
      onlineSubscription();
    };
  }, [cleanupPushDevice, isPending, user]);

  if (user === null || pushCleanupCapability === null) return children;

  return (
    <PushNotificationCoordinator pushCleanupCapability={pushCleanupCapability} userId={user.id}>
      {children}
    </PushNotificationCoordinator>
  );
};
