import type { ReactNode } from "react";
import { KnockExpoPushNotificationProvider } from "@knocklabs/expo";
import { KnockFeedProvider, KnockProvider } from "@knocklabs/react-native";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { appConfig } from "@/lib/app-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Knock feed providers — mirrors the web notifications-page wiring.
    Renders children bare when logged out or when Knock isn't configured.
    Push registration activates only once a Knock Expo channel id is set. */
export const KnockProviders = ({ children }: { children: ReactNode }) => {
  const { user } = useWorkspaceUser();
  const { resolvedTheme } = useTheme();

  const apiKey = appConfig.knockPublicApiKey;
  const feedId = appConfig.knockFeedChannelId;

  if (user === null || apiKey === undefined || feedId === undefined) {
    return children;
  }

  const feed = (
    <KnockFeedProvider feedId={feedId} colorMode={isDarkTheme(resolvedTheme) ? "dark" : "light"}>
      {children}
    </KnockFeedProvider>
  );

  return (
    <KnockProvider apiKey={apiKey} user={{ id: user.id }}>
      {appConfig.knockExpoChannelId !== undefined ? (
        <KnockExpoPushNotificationProvider knockExpoChannelId={appConfig.knockExpoChannelId}>
          {feed}
        </KnockExpoPushNotificationProvider>
      ) : (
        feed
      )}
    </KnockProvider>
  );
};
