import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LegendList } from "@legendapp/list/react-native";
import { parseServerDate } from "@repo/contracts/content";
import { describeNotification } from "@repo/contracts/notifications";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { SafeAreaView } from "@/lib/css-interop";

import type { RouterOutputs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { PushNotificationRegistration } from "@/components/notifications/push-notification-registration";
import { orpc } from "@/lib/api";
import { resolveNotificationTarget } from "@/lib/notification-target";
import { refreshNotifications } from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

type NotificationPage = RouterOutputs["notification"]["list"];
type NotificationCursor = NotificationPage["nextCursor"];
type NotificationRow = NotificationPage["notifications"][number];

const NotificationRowItem = ({ item, onPress }: { item: NotificationRow; onPress: () => void }) => {
  const description = describeNotification({ kind: item.kind, actorName: item.actorName });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description}
      accessibilityHint="Opens the letter"
      className="active:bg-accent border-border flex-row gap-3 border-b py-4"
      onPress={onPress}
    >
      <View className="w-2 items-center pt-2">
        {item.readAt === null ? <View className="bg-destructive size-2 rounded-full" /> : null}
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-medium">{description}</Text>
        <Text className="text-muted-foreground text-sm" numberOfLines={2}>
          {item.preview}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {formatDistanceToNowStrict(parseServerDate(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
    </Pressable>
  );
};

/** Mirrors components/post/post-feed.tsx: keyset pages, pull-to-refresh,
    and a fetch for a first page too short to scroll. */
const NotificationFeed = () => {
  const router = useRouter();
  const { data, isPending, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.notification.list.infiniteOptions({
        input: (pageParam: NotificationCursor) => ({ cursor: pageParam }),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }),
    );
  const [refreshing, setRefreshing] = useState(false);

  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const underfilled = viewportHeight > 0 && contentHeight > 0 && contentHeight <= viewportHeight;
  useEffect(() => {
    if (underfilled && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => undefined);
    }
  }, [underfilled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const markRead = useMutation(
    orpc.notification.markRead.mutationOptions({
      onSuccess: () => {
        refreshNotifications().catch(() => undefined);
      },
    }),
  );

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  const openNotification = (item: NotificationRow) => {
    if (item.readAt === null) markRead.mutate({ scope: "ids", ids: [item.id] });
    router.push(resolveNotificationTarget({ parentPostId: item.postId }));
  };

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Spinner />
      </View>
    );
  }

  if (isError) {
    return (
      <QueryErrorState
        message="Couldn't load notifications"
        onRetry={() => {
          refetch().catch(() => undefined);
        }}
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-sm">No replies yet</Text>
      </View>
    );
  }

  return (
    <LegendList
      style={{ flex: 1 }}
      data={notifications}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage().catch(() => undefined);
      }}
      onEndReachedThreshold={0.5}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
      onContentSizeChange={(_width, height) => setContentHeight(height)}
      onRefresh={() => {
        setRefreshing(true);
        refetch()
          .catch(() => undefined)
          .finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
      renderItem={({ item }) => (
        <NotificationRowItem item={item} onPress={() => openNotification(item)} />
      )}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="items-center py-5">
            <Spinner />
          </View>
        ) : null
      }
    />
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, isPending } = useWorkspaceUser();
  const { data: unread } = useQuery(
    orpc.notification.unreadCount.queryOptions({ enabled: user !== null }),
  );
  const markAllRead = useMutation(
    orpc.notification.markRead.mutationOptions({
      onSuccess: () => {
        refreshNotifications().catch(() => undefined);
      },
    }),
  );
  const hasUnread = user !== null && unread !== undefined && unread.count > 0;

  // Tab screens stay mounted, so a reply the polled badge counted while the
  // user sat elsewhere leaves this list stale until it is looked at again. The
  // mount fetch already covers the first focus.
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) refreshNotifications().catch(() => undefined);
      focusedBefore.current = true;
    }, []),
  );

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-2xl font-bold tracking-tight">Notifications</Text>
        {hasUnread ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => markAllRead.mutate({ scope: "all" })}
            loading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        ) : null}
      </View>
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      ) : user === null ? (
        <View className="flex-1 items-center justify-center gap-4 px-5">
          <Text className="text-muted-foreground text-center text-sm">
            Sign in to see replies to your love letters.
          </Text>
          <Button onPress={() => router.push("/auth/sign-in")}>Sign in</Button>
        </View>
      ) : (
        <View className="flex-1">
          <PushNotificationRegistration />
          <NotificationFeed />
        </View>
      )}
    </SafeAreaView>
  );
}
