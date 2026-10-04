/** Like bookkeeping for both clients' query caches, kept free of React and the
    query client so the cache arithmetic is unit-testable. Each platform's
    `like-button.tsx` binds it to its real feed/post-detail queries. Keys are
    `readonly unknown[]`, which is TanStack's `QueryKey`, so this package needs
    no TanStack dependency. */

export interface Likeable {
  id: string;
  isLiked: boolean;
  likeCount: number;
}

export interface FeedPages {
  pages: { posts: Likeable[] }[];
}
export interface PostDetail {
  post: Likeable & { comments?: Likeable[] };
}

type LikeUpdate = <T extends Likeable>(item: T) => T;

/** Idempotent: a second optimistic write for the same state (double tap
    racing the network) must not double-count. */
export const likePatch = <T extends Likeable>(item: T, liked: boolean): T =>
  item.isLiked === liked
    ? item
    : { ...item, isLiked: liked, likeCount: item.likeCount + (liked ? 1 : -1) };

/** The server's answer replaces the optimistic guess outright: its count also
    includes everyone else's likes since the page loaded. */
export const settleLike = <T extends Likeable>(item: T, settled: Likeable): T =>
  item.isLiked === settled.isLiked && item.likeCount === settled.likeCount
    ? item
    : { ...item, isLiked: settled.isLiked, likeCount: settled.likeCount };

const updateById = <T extends Likeable>(items: T[], postId: string, update: LikeUpdate): T[] =>
  items.map((item) => (item.id === postId ? update(item) : item));

const updateFeedPages = <T extends FeedPages>(
  data: T | undefined,
  postId: string,
  update: LikeUpdate,
): T | undefined =>
  data === undefined
    ? undefined
    : {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          posts: updateById(page.posts, postId, update),
        })),
      };

const updatePostDetail = <T extends PostDetail>(
  data: T | undefined,
  postId: string,
  update: LikeUpdate,
): T | undefined => {
  if (data === undefined) {
    return undefined;
  }
  const post = data.post.id === postId ? update(data.post) : data.post;
  if (post.comments === undefined) {
    return { ...data, post };
  }
  return { ...data, post: { ...post, comments: updateById(post.comments, postId, update) } };
};

export const patchFeedPages = <T extends FeedPages>(
  data: T | undefined,
  postId: string,
  liked: boolean,
): T | undefined => updateFeedPages(data, postId, (item) => likePatch(item, liked));

export const patchPostDetail = <T extends PostDetail>(
  data: T | undefined,
  postId: string,
  liked: boolean,
): T | undefined => updatePostDetail(data, postId, (item) => likePatch(item, liked));

export const settleFeedPages = <T extends FeedPages>(
  data: T | undefined,
  settled: Likeable,
): T | undefined => updateFeedPages(data, settled.id, (item) => settleLike(item, settled));

export const settlePostDetail = <T extends PostDetail>(
  data: T | undefined,
  settled: Likeable,
): T | undefined => updatePostDetail(data, settled.id, (item) => settleLike(item, settled));

export type CacheEntries<T> = [readonly unknown[], T | undefined][];

export interface LikeSnapshot<TFeed, TPost> {
  feeds: CacheEntries<TFeed>;
  posts: CacheEntries<TPost>;
}

/** The slice of the query client the handlers need; the button supplies the
    real one, tests an in-memory map. */
export interface LikeCache<TFeed extends FeedPages, TPost extends PostDetail> {
  cancel: () => Promise<void>;
  readFeeds: () => CacheEntries<TFeed>;
  readPosts: () => CacheEntries<TPost>;
  writeFeed: (queryKey: readonly unknown[], data: TFeed | undefined) => void;
  writePost: (queryKey: readonly unknown[], data: TPost | undefined) => void;
  /** Fire and forget: whatever it returns, the mutation must not wait on it. */
  refresh: () => void;
}

const likeableBefore = <TFeed extends FeedPages, TPost extends PostDetail>(
  snapshot: LikeSnapshot<TFeed, TPost>,
  postId: string,
): Likeable | undefined =>
  [
    ...snapshot.feeds.flatMap(([, data]) => data?.pages.flatMap((page) => page.posts) ?? []),
    ...snapshot.posts.flatMap(([, data]) =>
      data === undefined ? [] : [data.post, ...(data.post.comments ?? [])],
    ),
  ].find((item) => item.id === postId);

/** Optimistically toggles a like across every cached feed page and post
    detail (so remounted rows and the detail screen agree), puts this post back
    on error, and writes the server's own numbers on success. Nothing here
    refetches: an active infinite query refetches every loaded page in series,
    one round trip each, which is the cost this exists to avoid. */
export const createLikeMutationHandlers = <TFeed extends FeedPages, TPost extends PostDetail>(
  cache: LikeCache<TFeed, TPost>,
  postId: string,
  liked: boolean,
) => {
  const settle = (settled: Likeable) => {
    for (const [queryKey, data] of cache.readFeeds()) {
      cache.writeFeed(queryKey, settleFeedPages(data, settled));
    }
    for (const [queryKey, data] of cache.readPosts()) {
      cache.writePost(queryKey, settlePostDetail(data, settled));
    }
  };

  return {
    /** Restores this one post, not the whole snapshot: writing back entire
        cache entries would also undo whatever landed since onMutate, such as
        another letter's settled like or a newly loaded page, and nothing
        refetches afterwards to repair it. */
    onError: (
      _error: Error,
      _variables: { postId: string },
      snapshot: LikeSnapshot<TFeed, TPost> | undefined,
    ) => {
      const previous = snapshot === undefined ? undefined : likeableBefore(snapshot, postId);
      if (previous !== undefined) {
        settle(previous);
      }
    },
    onMutate: async (): Promise<LikeSnapshot<TFeed, TPost>> => {
      await cache.cancel();
      const feeds = cache.readFeeds();
      const posts = cache.readPosts();
      for (const [queryKey, data] of feeds) {
        cache.writeFeed(queryKey, patchFeedPages(data, postId, liked));
      }
      for (const [queryKey, data] of posts) {
        cache.writePost(queryKey, patchPostDetail(data, postId, liked));
      }
      return { feeds, posts };
    },
    onSettled: () => {
      cache.refresh();
    },
    /** `post` is optional so a server without it (an API rolled back, or a
        store build released ahead of its API) keeps the optimistic state
        rather than throwing into onError and reverting a like that was saved;
        onSettled's refresh still runs. */
    onSuccess: (result: { post?: Likeable }) => {
      if (result.post !== undefined) {
        settle(result.post);
      }
    },
  };
};
