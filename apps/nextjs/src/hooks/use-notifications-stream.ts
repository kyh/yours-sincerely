import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@init/db/supabase-browser-client";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@init/api";

type Notification = RouterOutputs["notifications"]["fetchNotifications"][0];

export const useNotificationsStream = (params: {
  onNotifications: (notifications: Notification[]) => void;
  accountIds: string[];
  enabled: boolean;
}) => {
  const client = getSupabaseBrowserClient();

  const { data: subscription } = useQuery({
    enabled: params.enabled,
    queryKey: ["realtime-notifications", ...params.accountIds],
    queryFn: () => {
      const channel = client.channel("notifications-channel");

      return channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            filter: `accountId=in.(${params.accountIds.join(", ")})`,
            table: "Notifications",
          },
          (payload) => {
            params.onNotifications([payload.new as Notification]);
          },
        )
        .subscribe();
    },
  });

  useEffect(() => {
    return () => {
      void subscription?.unsubscribe();
    };
  }, [subscription]);
};
