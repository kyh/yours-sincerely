import { View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedLayout } from "@/lib/feed-layout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { trpc } from "@/lib/api";
import { CardStack } from "./card-stack";
import { PostContent } from "./post-content";

/** Mirrors apps/web posts/_components/post-feed.tsx. */
type Props = {
  layout?: FeedLayout;
  filters?: {
    userId?: string;
    parentId?: string;
    limit?: number;
  };
};

export const PostFeed = ({ layout = "list", filters = {} }: Props) => {
  const {
    data,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    trpc.post.getFeed.infiniteQueryOptions(filters, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
  );

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
      <View className="flex-1 items-center justify-center gap-3 py-10">
        <Text className="text-sm">Couldn't load posts</Text>
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            refetch().catch(() => undefined);
          }}
        >
          Retry
        </Button>
      </View>
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
      onRefresh={() => {
        refetch().catch(() => undefined);
      }}
      refreshing={isRefetching}
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
