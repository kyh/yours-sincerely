import type { QueryKey } from "@tanstack/react-query";

/** Optimistic like bookkeeping, kept free of React and the query client so
    the cache arithmetic is unit-testable. `like-button.tsx` binds it to the
    real feed/post-detail queries. */

export type Likeable = { id: string; isLiked: boolean; likeCount: number };

export type FeedPages = { pages: { posts: Likeable[] }[] };
export type PostDetail = { post: Likeable & { comments?: Likeable[] } };

/** Idempotent: a second optimistic write for the same state (double tap
    racing the network) must not double-count. */
export const likePatch = <T extends Likeable>(item: T, liked: boolean): T =>
  item.isLiked === liked
    ? item
    : { ...item, isLiked: liked, likeCount: item.likeCount + (liked ? 1 : -1) };

const patchById = <T extends Likeable>(items: T[], postId: string, liked: boolean): T[] =>
  items.map((item) => (item.id === postId ? likePatch(item, liked) : item));

export const patchFeedPages = <T extends FeedPages>(
  data: T | undefined,
  postId: string,
  liked: boolean,
): T | undefined =>
  data === undefined
    ? undefined
    : {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          posts: patchById(page.posts, postId, liked),
        })),
      };

export const patchPostDetail = <T extends PostDetail>(
  data: T | undefined,
  postId: string,
  liked: boolean,
): T | undefined => {
  if (data === undefined) return undefined;
  const post = data.post.id === postId ? likePatch(data.post, liked) : data.post;
  if (post.comments === undefined) return { ...data, post };
  return { ...data, post: { ...post, comments: patchById(post.comments, postId, liked) } };
};

export type CacheEntries<T> = [QueryKey, T | undefined][];

export type LikeSnapshot<TFeed, TPost> = {
  feeds: CacheEntries<TFeed>;
  posts: CacheEntries<TPost>;
};

/** The slice of the query client the handlers need; the button supplies the
    real one, tests an in-memory map. */
export type LikeCache<TFeed extends FeedPages, TPost extends PostDetail> = {
  cancel: () => Promise<void>;
  readFeeds: () => CacheEntries<TFeed>;
  readPosts: () => CacheEntries<TPost>;
  writeFeed: (queryKey: QueryKey, data: TFeed | undefined) => void;
  writePost: (queryKey: QueryKey, data: TPost | undefined) => void;
  refresh: () => void;
};

/** Optimistically toggles a like across every cached feed page and post
    detail (so remounted rows and the detail screen agree), restoring the
    snapshot on error and refreshing from the server either way. */
export const createLikeMutationHandlers = <TFeed extends FeedPages, TPost extends PostDetail>(
  cache: LikeCache<TFeed, TPost>,
  postId: string,
  liked: boolean,
) => ({
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
  onError: (
    _error: Error,
    _variables: { postId: string },
    snapshot: LikeSnapshot<TFeed, TPost> | undefined,
  ) => {
    if (snapshot === undefined) return;
    for (const [queryKey, data] of snapshot.feeds) {
      cache.writeFeed(queryKey, data);
    }
    for (const [queryKey, data] of snapshot.posts) {
      cache.writePost(queryKey, data);
    }
  },
  onSettled: () => {
    cache.refresh();
  },
});
