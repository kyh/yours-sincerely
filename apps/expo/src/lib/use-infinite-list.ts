import { useEffect, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";

import { ignoreRejection } from "./ignore-rejection";

type InfiniteListQuery<TPage, TPageParam, TError> = Pick<
  UseInfiniteQueryResult<InfiniteData<TPage, TPageParam>, TError>,
  "data" | "fetchNextPage" | "hasNextPage" | "isError" | "isFetching" | "refetch"
>;

/**
 * Paging for a LegendList over a `useInfiniteQuery` result: pull-to-refresh,
 * load-more at the end, and loading on until a short first page fills the
 * viewport.
 *
 * LegendList reports the end once per approach — once for a list shorter than
 * the viewport, then only after the user scrolls away and back. So a load asked
 * for while any fetch runs is remembered and sent once it settles: sending it
 * then would cancel a background refetch, and dropping it would leave the user
 * stuck at the bottom.
 */
export const useInfiniteList = <TPage, TPageParam, TError>(
  {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    refetch,
  }: InfiniteListQuery<TPage, TPageParam, TError>,
  // Off where the list is swapped out once data arrives (the card stack): its
  // last measurement, taken of the full-height spinner, never updates, and that
  // stale "underfilled" would page through the whole feed.
  { fillViewport = true }: { fillViewport?: boolean } = {},
) => {
  const pageCount = data?.pages.length ?? 0;
  // The page count a load was asked for at: the next page arriving retires it.
  const [requestedAt, setRequestedAt] = useState<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const underfilled = viewportHeight > 0 && contentHeight > 0 && contentHeight <= viewportHeight;
  const wantsMore = requestedAt === pageCount || (fillViewport && underfilled);

  useEffect(() => {
    if (wantsMore && hasNextPage && !isFetching && !isError) {
      void ignoreRejection(fetchNextPage({ cancelRefetch: false }));
    }
  }, [wantsMore, hasNextPage, isFetching, isError, fetchNextPage]);

  const loadMore = () => setRequestedAt(pageCount);

  return {
    listProps: {
      onContentSizeChange: (_width: number, height: number) => setContentHeight(height),
      onEndReached: loadMore,
      onEndReachedThreshold: 0.5,
      onLayout: (event: LayoutChangeEvent) => setViewportHeight(event.nativeEvent.layout.height),
      onRefresh: async () => {
        setRefreshing(true);
        await ignoreRejection(refetch());
        setRefreshing(false);
      },
      // Only an explicit pull shows the refresh spinner; `isRefetching` would also
      // flash it on every background invalidation after a like or flag.
      refreshing,
    },
    loadMore,
  };
};
