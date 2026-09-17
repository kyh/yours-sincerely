import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/api";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { refreshNotifications } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

export const MarkAllReadButton = () => {
  const { user } = useWorkspaceUser();
  const { data: unread } = useQuery(
    orpc.notification.unreadCount.queryOptions({ enabled: user !== null }),
  );
  const markAllRead = useMutation(
    orpc.notification.markRead.mutationOptions({
      onError: () => toast.error("Could not mark notifications as read. Please try again."),
      onSuccess: () => {
        void ignoreRejection(refreshNotifications());
      },
    }),
  );

  if (user === null || unread === undefined || unread.count === 0) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onPress={() => markAllRead.mutate({ scope: "all" })}
      loading={markAllRead.isPending}
    >
      Mark all as read
    </Button>
  );
};
