import type { RouterOutputs } from "@repo/api";

export type FeedFilters = {
  userId?: string;
  parentId?: string;
  limit?: number;
};

type FeedCursor = RouterOutputs["post"]["getFeed"]["nextCursor"];

/**
 * Arguments for `post.getFeed.infiniteOptions`, shared by the RSC prefetch and
 * the client hook that takes the query over.
 *
 * The query key embeds the input built at `initialPageParam`, so the two sides
 * have to produce it identically or hydration misses and the page silently
 * refetches — a failure no type or test can catch. Building it here is the only
 * thing that makes them the same key. The two `orpc` utils differ (in-process
 * caller vs. RPC link), so only the arguments can be shared, not the options.
 */
export const feedInfiniteArgs = (filters: FeedFilters) => ({
  input: (cursor: FeedCursor) => ({ ...filters, cursor }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage: RouterOutputs["post"]["getFeed"]) => lastPage.nextCursor,
});
