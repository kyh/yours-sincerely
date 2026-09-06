"use client";

import Link from "next/link";
import { parseServerDate } from "@repo/contracts/content";
import { describeNotification } from "@repo/contracts/notifications";
import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { cn } from "cn";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import useInfiniteScroll from "react-infinite-scroll-hook";

import type { RouterOutputs } from "@repo/api";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getAvatarUrl } from "@/lib/avatars";
import { notificationInfiniteArgs } from "@/lib/notification-query";
import { refreshNotifications } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";

type Notification = RouterOutputs["notification"]["list"]["notifications"][number];

const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.notification.markRead.mutationOptions({
      onSuccess: () => refreshNotifications(queryClient),
    }),
  );
};

const MarkAllReadButtonInner = () => {
  const { data } = useSuspenseQuery(orpc.notification.unreadCount.queryOptions());
  const markRead = useMarkRead();

  if (data.count === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={markRead.isPending}
      onClick={() => markRead.mutate({ scope: "all" })}
    >
      Mark all as read
    </Button>
  );
};

export const MarkAllReadButton = () => {
  const user = useWorkspaceUser();
  if (user === null) return null;
  return <MarkAllReadButtonInner />;
};

type RowProps = {
  notification: Notification;
  onOpen: () => void;
};

const NotificationRow = ({ notification, onOpen }: RowProps) => {
  const isUnread = notification.readAt === null;
  const createdAt = parseServerDate(notification.createdAt);

  return (
    <li>
      <Link
        href={`/posts/${notification.postId}`}
        onClick={onOpen}
        className="hover:bg-accent -mx-3 flex items-start gap-3 rounded-lg px-3 py-4 transition"
      >
        <ProfileAvatar
          displayName={notification.actorName}
          src={getAvatarUrl(notification.actorName)}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm", isUnread && "font-medium")}>
            {describeNotification(notification)}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-sm">{notification.preview}</p>
          <time
            dateTime={createdAt.toISOString()}
            className="text-muted-foreground mt-1 block text-xs"
            suppressHydrationWarning
          >
            {formatDistanceToNowStrict(createdAt, { addSuffix: true })}
          </time>
        </div>
        {isUnread && (
          <span className="bg-destructive mt-2 size-1.5 shrink-0 rounded-full">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </Link>
    </li>
  );
};

const NotificationList = () => {
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } = useSuspenseInfiniteQuery(
    orpc.notification.list.infiniteOptions(notificationInfiniteArgs()),
  );
  const markRead = useMarkRead();

  const [ref] = useInfiniteScroll({
    loading: isFetchingNextPage,
    hasNextPage,
    onLoadMore: fetchNextPage,
  });

  const notifications = data.pages.flatMap((page) => page.notifications);

  return (
    <section className="flex-1">
      {!notifications.length && (
        <div className="h-full py-5 text-center text-sm">No notifications</div>
      )}
      <ul className="divide-border divide-y">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onOpen={() => {
              if (notification.readAt === null) {
                markRead.mutate({ scope: "ids", ids: [notification.id] });
              }
            }}
          />
        ))}
      </ul>
      {hasNextPage && (
        <div className="flex items-center justify-center pt-5 pb-3" ref={ref}>
          <Spinner />
        </div>
      )}
    </section>
  );
};

export const NotificationsPage = () => {
  const user = useWorkspaceUser();
  if (user === null) return null;
  return <NotificationList />;
};
