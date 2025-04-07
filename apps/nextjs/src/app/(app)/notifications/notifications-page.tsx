"use client";

import {
  KnockFeedProvider,
  NotificationFeed as KnockNotificationFeed,
  KnockProvider,
} from "@knocklabs/react";
import { isDarkTheme, useTheme } from "@kyh/ui/theme";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/react";

export const NotificationsPage = () => {
  const trpc = useTRPC();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.auth.workspace.queryOptions());
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
