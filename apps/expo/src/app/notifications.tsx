import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LegendList } from "@legendapp/list/react-native";
import { parseServerDate } from "@repo/contracts/content";
import { describeNotification } from "@repo/contracts/notifications";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "cn";
import { toast } from "sonner-native";

import type { RouterOutputs } from "@/lib/api";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { PushNotificationRegistration } from "@/components/notifications/push-notification-registration";
import { orpc } from "@/lib/api";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { resolveNotificationTarget } from "@/lib/notification-target";
import { refreshNotifications } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

type NotificationPage = RouterOutputs["notification"]["list"];
type NotificationCursor = NotificationPage["nextCursor"];
type NotificationRow = NotificationPage["notifications"][number];

const NotificationRowItem = ({ item, onPress }: { item: NotificationRow; onPress: () => void }) => {
  const description = describeNotification({ actorName: item.actorName, kind: item.kind });
  const isUnread = item.readAt === null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isUnread ? "Unread. " : ""}${description}. ${item.preview}`}
      accessibilityHint="Opens the letter"
      className="active:bg-accent border-border flex-row items-start gap-3 border-b py-4"
      onPress={onPress}
    >
      <ProfileAvatar name={item.actorName} size={36} />
      <View className="flex-1 gap-1">
        <Text className={cn("text-sm", isUnread && "font-medium")}>{description}</Text>
        <Text className="text-muted-foreground text-sm" numberOfLines={2}>
          {item.preview}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {formatDistanceToNowStrict(parseServerDate(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      {isUnread ? <View className="bg-destructive mt-2 size-1.5 rounded-full" /> : null}
    </Pressable>
  );
};

/** Mirrors components/post/post-feed.tsx: keyset pages, pull-to-refresh,
    and a fetch for a first page too short to scroll. */
const NotificationFeed = () => {
  const router = useRouter();
  const {
    data,
    isPending,
    isError,
    isFetchNextPageError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(
    orpc.notification.list.infiniteOptions({
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (pageParam: NotificationCursor) => ({ cursor: pageParam }),
    }),
  );
  const [refreshing, setRefreshing] = useState(false);

  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const underfilled = viewportHeight > 0 && contentHeight > 0 && contentHeight <= viewportHeight;
  useEffect(() => {
    if (underfilled && hasNextPage && !isFetchingNextPage && !isError) {
      void ignoreRejection(fetchNextPage());
    }
  }, [underfilled, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const markRead = useMutation(
    orpc.notification.markRead.mutationOptions({
      onError: () => toast.error("Could not mark this notification as read. Please try again."),
      onSuccess: () => {
        void ignoreRejection(refreshNotifications());
      },
    }),
  );

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  const openNotification = (item: NotificationRow) => {
    if (item.readAt === null) {
      markRead.mutate({ ids: [item.id], scope: "ids" });
    }
    router.push(resolveNotificationTarget({ parentPostId: item.postId }));
  };

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Spinner />
      </View>
    );
  }

  if (isError && data === undefined) {
    return (
      <View className="flex-1 py-5">
        <QueryErrorState
          message="Couldn't load notifications"
          onRetry={() => {
            void ignoreRejection(refetch());
          }}
        />
      </View>
    );
  }

  let footer: ReactNode = null;
  if (isError) {
    footer = (
      <View className="items-center gap-3 py-5">
        <Text className="text-sm">Couldn&apos;t load notifications</Text>
        <Button
          size="sm"
          variant="outline"
          loading={isFetching}
          onPress={() => {
            void ignoreRejection(isFetchNextPageError ? fetchNextPage() : refetch());
          }}
        >
          Try again
        </Button>
      </View>
    );
  } else if (isFetchingNextPage) {
    footer = (
      <View className="items-center py-5">
        <Spinner />
      </View>
    );
  }

  return (
    <LegendList
      style={{ flex: 1 }}
      data={notifications}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage && !isError) {
          void ignoreRejection(fetchNextPage());
        }
      }}
      onEndReachedThreshold={0.5}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
      onContentSizeChange={(_width, height) => setContentHeight(height)}
      onRefresh={async () => {
        setRefreshing(true);
        await ignoreRejection(refetch());
        setRefreshing(false);
      }}
      refreshing={refreshing}
      contentContainerStyle={{ paddingVertical: 20 }}
      ListHeaderComponent={<PushNotificationRegistration />}
      renderItem={({ item }) => (
        <NotificationRowItem item={item} onPress={() => openNotification(item)} />
      )}
      ListEmptyComponent={
        <View className="items-center justify-center py-10">
          <Text className="text-sm">No notifications</Text>
        </View>
      }
      ListFooterComponent={footer}
    />
  );
};

const NotificationsScreen = () => {
  const router = useRouter();
  const { user, isPending, isError, refetch: refetchWorkspace } = useWorkspaceUser();
  // Stack screens stay mounted, so a reply the polled badge counted while the
  // user sat elsewhere leaves this list stale until it is looked at again. The
  // mount fetch already covers the first focus.
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) {
        void ignoreRejection(refreshNotifications());
      }
      focusedBefore.current = true;
    }, []),
  );

  let content: ReactNode;
  if (isPending) {
    content = (
      <View className="flex-1 items-center justify-center py-5">
        <Spinner />
      </View>
    );
  } else if (isError && user === null) {
    content = (
      <View className="flex-1 py-5">
        <QueryErrorState
          message="Couldn't load your account"
          onRetry={() => {
            void ignoreRejection(refetchWorkspace());
          }}
        />
      </View>
    );
  } else if (user === null) {
    content = (
      <View className="flex-1 items-center justify-center gap-4 px-5 py-5">
        <Text className="text-muted-foreground text-center text-sm">
          Sign in to see replies to your love letters.
        </Text>
        <Button
          onPress={() =>
            router.push({ params: { next: "/notifications" }, pathname: "/auth/sign-in" })
          }
        >
          Sign in
        </Button>
      </View>
    );
  } else {
    content = <NotificationFeed />;
  }

  return content;
};

export default NotificationsScreen;
