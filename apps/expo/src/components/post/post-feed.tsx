import { useEffect, useState } from "react";
import { View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@/lib/api";
import type { FeedLayout } from "@/lib/feed-layout";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/api";
import { CardStack } from "./card-stack";
import { PostContent } from "./post-content";

type FeedCursor = RouterOutputs["post"]["getFeed"]["nextCursor"];

/** Mirrors apps/web posts/_components/post-feed.tsx. */
type Props = {
  layout?: FeedLayout;
  filters?: {
    userId?: string;
    parentId?: string;
    limit?: number;
  };
};

const EMPTY_FILTERS: NonNullable<Props["filters"]> = {};

export const PostFeed = ({ layout = "list", filters = EMPTY_FILTERS }: Props) => {
  const { data, isPending, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.post.getFeed.infiniteOptions({
        input: (pageParam: FeedCursor) => ({ ...filters, cursor: pageParam }),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }),
    );
  // Only an explicit pull shows the refresh spinner; `isRefetching` would also
  // flash it on every background invalidation after a like or flag.
  const [refreshing, setRefreshing] = useState(false);

  // Web's load-more sentinel is an IntersectionObserver, so it fires as soon as
  // it is on screen. `onEndReached` only fires on scroll: a first page shorter
  // than the viewport (iPad, short letters) would never grow without this.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const underfilled = viewportHeight > 0 && contentHeight > 0 && contentHeight <= viewportHeight;
  useEffect(() => {
    if (underfilled && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => undefined);
    }
  }, [underfilled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

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
        message="Couldn't load posts"
        onRetry={() => {
          refetch().catch(() => undefined);
        }}
      />
    );
  }

  if (posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-sm">No posts</Text>
      </View>
    );
  }

  if (layout === "stack") {
    return (
      <CardStack
        data={posts}
        hasNextPage={hasNextPage}
        onLoadMore={() => {
          fetchNextPage().catch(() => undefined);
        }}
        render={(post) => (
          <PostContent layout="stack" post={post} asLink={false} showMore={false} minHeight />
        )}
      />
    );
  }

  return (
    <LegendList
      style={{ flex: 1 }}
      data={posts}
      keyExtractor={(post) => post.id}
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
        <View className="border-border border-b pt-5 pb-3">
          <PostContent post={item} showMore={false} />
        </View>
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
