import { useCallback, useEffect, type ReactNode } from "react";
import { KnockExpoPushNotificationProvider } from "@knocklabs/expo";
import { KnockFeedProvider, KnockProvider } from "@knocklabs/react-native";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { onlineManager, useMutation } from "@tanstack/react-query";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { queryClient, trpc } from "@/lib/api";
import { appConfig } from "@/lib/app-config";
import { deleteRegisteredPushDevice, getRegisteredPushDevice } from "@/lib/push-token-store";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { PushNotificationCoordinator } from "./push-notification-registration";

/** Knock feed providers — mirrors the web notifications-page wiring.
    Renders children bare when logged out or when Knock isn't configured.
    Push registration activates only once a Knock Expo channel id is set. */
export const KnockProviders = ({ children }: { children: ReactNode }) => {
  const { user, knockUserToken, pushCleanupCapability, isPending } = useWorkspaceUser();
  const { resolvedTheme } = useTheme();
  const { mutateAsync: cleanupPushDevice } = useMutation(
    trpc.auth.cleanupPushDevice.mutationOptions({ networkMode: "always" }),
  );

  const apiKey = appConfig.knockPublicApiKey;
  const feedId = appConfig.knockFeedChannelId;
  const refreshUserToken = useCallback(async () => {
    const { token } = await queryClient.fetchQuery({
      ...trpc.auth.knockUserToken.queryOptions(),
      staleTime: 0,
    });
    return token ?? undefined;
  }, []);

  useEffect(() => {
    if (isPending || user !== null || getRegisteredPushDevice() === null) return;

    const retryCleanup = () => {
      const device = getRegisteredPushDevice();
      if (device === null) return;

      cleanupPushDevice({ capability: device.cleanupCapability, token: device.token })
        .then(() => Notifications.unregisterForNotificationsAsync())
        .then(() => deleteRegisteredPushDevice())
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

  if (user === null || apiKey === undefined || feedId === undefined) {
    return children;
  }

  const feed = (
    <KnockFeedProvider feedId={feedId} colorMode={isDarkTheme(resolvedTheme) ? "dark" : "light"}>
      {children}
    </KnockFeedProvider>
  );

  return (
    <KnockProvider
      apiKey={apiKey}
      user={{ id: user.id }}
      userToken={knockUserToken ?? undefined}
      onUserTokenExpiring={refreshUserToken}
    >
      {appConfig.knockExpoChannelId !== undefined && pushCleanupCapability !== null ? (
        <KnockExpoPushNotificationProvider
          knockExpoChannelId={appConfig.knockExpoChannelId}
          autoRegister={false}
        >
          <PushNotificationCoordinator
            pushCleanupCapability={pushCleanupCapability}
            userId={user.id}
          >
            {feed}
          </PushNotificationCoordinator>
        </KnockExpoPushNotificationProvider>
      ) : (
        feed
      )}
    </KnockProvider>
  );
};
