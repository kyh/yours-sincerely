import type { ReactNode } from "react";
import { View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedFilters, RouterOutputs } from "@/lib/api";
import type { FeedLayout } from "@/lib/feed-layout";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/api";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { useInfiniteList } from "@/lib/use-infinite-list";
import { CardStack } from "./card-stack";
import { PostContent } from "./post-content";

type FeedCursor = RouterOutputs["post"]["getFeed"]["nextCursor"];

/** Mirrors apps/web posts/_components/post-feed.tsx. */
interface Props {
  header?: ReactNode;
  layout?: FeedLayout;
  filters?: FeedFilters;
}

const EMPTY_FILTERS: FeedFilters = {};

export const PostFeed = ({ layout = "list", filters = EMPTY_FILTERS, header }: Props) => {
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
    orpc.post.getFeed.infiniteOptions({
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (pageParam: FeedCursor) => ({ ...filters, cursor: pageParam }),
    }),
  );
  const { listProps, loadMore } = useInfiniteList(
    { data, fetchNextPage, hasNextPage, isError, isFetching, refetch },
    { fillViewport: layout === "list" },
  );

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  let emptyState: ReactNode = (
    <View className="flex-1 items-center justify-center py-10">
      <Text className="text-sm">No posts</Text>
    </View>
  );
  if (isPending) {
    emptyState = (
      <View className="flex-1 items-center justify-center py-10">
        <Spinner />
      </View>
    );
  } else if (isError && data === undefined) {
    emptyState = (
      <QueryErrorState
        message="Couldn't load posts"
        onRetry={() => {
          void ignoreRejection(refetch());
        }}
      />
    );
  }

  const loadError =
    isError && data !== undefined ? (
      <View className="items-center gap-3 py-5">
        <Text className="text-center text-sm">
          {isFetchNextPageError ? "Couldn't load more posts" : "Couldn't refresh posts"}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            void ignoreRejection(isFetchNextPageError ? fetchNextPage() : refetch());
          }}
        >
          Try again
        </Button>
      </View>
    ) : null;

  if (layout === "stack" && posts.length > 0) {
    return (
      <View className="flex-1 pt-5">
        {loadError}
        <CardStack
          data={posts}
          hasNextPage={hasNextPage}
          onLoadMore={loadMore}
          render={(post) => (
            <PostContent layout="stack" post={post} asLink={false} showMore={false} minHeight />
          )}
        />
      </View>
    );
  }

  return (
    <LegendList
      {...listProps}
      style={{ flex: 1 }}
      data={posts}
      keyExtractor={(post) => post.id}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
      ListEmptyComponent={emptyState}
      ListHeaderComponent={
        <>
          {header}
          {isFetchNextPageError ? null : loadError}
        </>
      }
      renderItem={({ item }) => (
        <View className="border-border border-b pt-5 pb-3">
          <PostContent post={item} showMore={false} />
        </View>
      )}
      ListFooterComponent={
        <>
          {isFetchingNextPage && (
            <View className="items-center py-5">
              <Spinner />
            </View>
          )}
          {isFetchNextPageError ? loadError : null}
        </>
      }
    />
  );
};
