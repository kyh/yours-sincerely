"use client";

import { useCallback } from "react";
import {
  KnockFeedProvider,
  NotificationFeed as KnockNotificationFeed,
  KnockProvider,
} from "@knocklabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { isDarkTheme, useTheme } from "@/components/theme";

import { useWorkspace } from "@/lib/use-workspace-user";
import { useTRPC } from "@/trpc/react";

export const NotificationsPage = () => {
  const { user, knockUserToken } = useWorkspace();
  const { resolvedTheme } = useTheme();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const refreshUserToken = useCallback(async () => {
    const { token } = await queryClient.fetchQuery({
      ...trpc.auth.knockUserToken.queryOptions(),
      staleTime: 0,
    });
    return token ?? undefined;
  }, [queryClient, trpc.auth.knockUserToken]);

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
