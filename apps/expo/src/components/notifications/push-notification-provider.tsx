import { useEffect } from "react";
import type { ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { onlineManager } from "@tanstack/react-query";

import { ignoreRejection } from "@/lib/ignore-rejection";
import { getRegisteredPushDevice } from "@/lib/push-token-store";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { PushNotificationCoordinator } from "./push-notification-registration";
import { usePushDeviceCleanup } from "./use-push-device-cleanup";

/** Runs push registration for the signed-in user. Signed out, it keeps
    retrying the server-side release of a device record that an offline
    sign-out could not clear. */
export const PushNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, pushCleanupCapability, isPending, isError } = useWorkspaceUser();
  const cleanupPushDevice = usePushDeviceCleanup();

  useEffect(() => {
    if (isPending || isError || user !== null || getRegisteredPushDevice() === null) {
      return;
    }

    const retryCleanup = () => {
      const device = getRegisteredPushDevice();
      if (device === null) {
        return;
      }

      const releaseDevice = async () => {
        await cleanupPushDevice(device);
        await Notifications.unregisterForNotificationsAsync();
      };
      void ignoreRejection(releaseDevice());
    };

    retryCleanup();
    const appStateSubscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        retryCleanup();
      }
    });
    const onlineSubscription = onlineManager.subscribe((online) => {
      if (online) {
        retryCleanup();
      }
    });

    return () => {
      appStateSubscription.remove();
      onlineSubscription();
    };
  }, [cleanupPushDevice, isError, isPending, user]);

  // Rendered even signed out: this wraps the whole app, so swapping it for bare
  // `children` when the user changes would remount every screen below it.
  return (
    <PushNotificationCoordinator
      identity={
        user === null || pushCleanupCapability === null
          ? null
          : { pushCleanupCapability, userId: user.id }
      }
    >
      {children}
    </PushNotificationCoordinator>
  );
};
