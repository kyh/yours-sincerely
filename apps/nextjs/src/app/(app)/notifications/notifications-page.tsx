"use client";

import { isDarkTheme, useTheme } from "@init/ui/theme";
import {
  KnockFeedProvider,
  NotificationFeed as KnockNotificationFeed,
  KnockProvider,
} from "@knocklabs/react";

import { api } from "@/trpc/react";

export const NotificationsPage = () => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const { resolvedTheme } = useTheme();

  return (
    <KnockProvider
      apiKey={process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY!}
      userId={user?.id}
    >
      <KnockFeedProvider
        feedId={process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID!}
        colorMode={isDarkTheme(resolvedTheme) ? "dark" : "light"}
      >
        <KnockNotificationFeed />
      </KnockFeedProvider>
    </KnockProvider>
  );
};
