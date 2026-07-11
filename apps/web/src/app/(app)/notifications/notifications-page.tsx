"use client";

import {
  KnockFeedProvider,
  NotificationFeed as KnockNotificationFeed,
  KnockProvider,
} from "@knocklabs/react";
import { isDarkTheme, useTheme } from "@/components/theme";

import { useKnockTokenRefresh } from "@/lib/use-knock-token-refresh";
import { useWorkspace } from "@/lib/use-workspace-user";

export const NotificationsPage = () => {
  const { user, knockUserToken } = useWorkspace();
  const { resolvedTheme } = useTheme();
  const refreshUserToken = useKnockTokenRefresh();

  if (user === null) return null;

  return (
    <KnockProvider
      apiKey={process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY}
      user={{ id: user.id }}
      userToken={knockUserToken ?? undefined}
      onUserTokenExpiring={refreshUserToken}
    >
      <KnockFeedProvider
        feedId={process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID}
        colorMode={isDarkTheme(resolvedTheme) ? "dark" : "light"}
      >
        <KnockNotificationFeed />
      </KnockFeedProvider>
    </KnockProvider>
  );
};
