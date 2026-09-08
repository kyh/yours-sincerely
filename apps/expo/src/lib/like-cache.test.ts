import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { QueryKey } from "@tanstack/react-query";

import {
  createLikeMutationHandlers,
  likePatch,
  patchFeedPages,
  patchPostDetail,
} from "./like-cache.ts";
import type { CacheEntries, FeedPages, PostDetail } from "./like-cache.ts";

const post = (id: string, likeCount = 0, isLiked = false) => ({ id, isLiked, likeCount });

const feed = (): FeedPages => ({
  pages: [{ posts: [post("a", 3), post("b", 1, true)] }, { posts: [post("a", 3), post("c")] }],
});

const detail = (): PostDetail => ({
  post: { ...post("a", 3), comments: [post("b", 1, true), post("c")] },
});

describe("likePatch", () => {
  it("toggles the flag and moves the count by one", () => {
    assert.deepEqual(likePatch(post("a", 3), true), post("a", 4, true));
    assert.deepEqual(likePatch(post("a", 4, true), false), post("a", 3));
  });

  it("is idempotent for a state the cache already shows", () => {
    const liked = post("a", 4, true);
    assert.equal(likePatch(liked, true), liked);
  });
});

describe("patchFeedPages / patchPostDetail", () => {
  it("patches every page a post appears on and nothing else", () => {
    const patched = patchFeedPages(feed(), "a", true);
    assert.ok(patched);
    assert.deepEqual(
      patched.pages.map((page) => page.posts),
      [
        [post("a", 4, true), post("b", 1, true)],
        [post("a", 4, true), post("c")],
      ],
    );
  });

  it("patches the detail post or one of its comments", () => {
    const likedRoot = patchPostDetail(detail(), "a", true);
    assert.ok(likedRoot);
    assert.equal(likedRoot.post.likeCount, 4);
    assert.equal(likedRoot.post.isLiked, true);
    assert.deepEqual(likedRoot.post.comments, [post("b", 1, true), post("c")]);

    const unlikedComment = patchPostDetail(detail(), "b", false);
    assert.ok(unlikedComment);
    assert.equal(unlikedComment.post.likeCount, 3);
    assert.deepEqual(unlikedComment.post.comments, [post("b", 0), post("c")]);
  });

  it("leaves a detail without comments untouched apart from the post", () => {
    const patched = patchPostDetail({ post: post("a", 3) }, "a", true);
    assert.deepEqual(patched, { post: post("a", 4, true) });
  });

  it("passes empty cache slots through", () => {
    assert.equal(patchFeedPages(undefined, "a", true), undefined);
    assert.equal(patchPostDetail(undefined, "a", true), undefined);
  });
});

/** In-memory stand-in for the query client: one typed slot per query. */
const createCacheHarness = () => {
  const feedKey: QueryKey = ["post", "getFeed", { type: "infinite" }];
  const emptyFeedKey: QueryKey = ["post", "getFeed", { input: { userId: "u" }, type: "infinite" }];
  const postKey: QueryKey = ["post", "getPost", { input: { postId: "a" } }];
  const feeds = new Map<string, FeedPages | undefined>([
    [JSON.stringify(feedKey), feed()],
    [JSON.stringify(emptyFeedKey), undefined],
  ]);
  const posts = new Map<string, PostDetail | undefined>([[JSON.stringify(postKey), detail()]]);
  let cancelCount = 0;
  let refreshCount = 0;

  return {
    cache: {
      cancel: () => {
        cancelCount += 1;
        return Promise.resolve();
      },
      readFeeds: (): CacheEntries<FeedPages> =>
        [feedKey, emptyFeedKey].map((key) => [key, feeds.get(JSON.stringify(key))]),
      readPosts: (): CacheEntries<PostDetail> => [[postKey, posts.get(JSON.stringify(postKey))]],
      refresh: () => {
        refreshCount += 1;
      },
      writeFeed: (queryKey: QueryKey, data: FeedPages | undefined) => {
        feeds.set(JSON.stringify(queryKey), data);
      },
      writePost: (queryKey: QueryKey, data: PostDetail | undefined) => {
        posts.set(JSON.stringify(queryKey), data);
      },
    },
    get cancelCount() {
      return cancelCount;
    },
    emptyFeedKey,
    get feed() {
      return feeds.get(JSON.stringify(feedKey));
    },
    feedKey,
    get post() {
      return posts.get(JSON.stringify(postKey));
    },
    postKey,
    get refreshCount() {
      return refreshCount;
    },
  };
};

describe("createLikeMutationHandlers", () => {
  it("cancels in-flight fetches, patches feed and detail, and returns a snapshot", async () => {
    const harness = createCacheHarness();
    const handlers = createLikeMutationHandlers(harness.cache, "a", true);

    const snapshot = await handlers.onMutate();

    assert.equal(harness.cancelCount, 1);
    assert.deepEqual(snapshot, {
      feeds: [
        [harness.feedKey, feed()],
        [harness.emptyFeedKey, undefined],
      ],
      posts: [[harness.postKey, detail()]],
    });
    assert.deepEqual(harness.feed, patchFeedPages(feed(), "a", true));
    assert.deepEqual(harness.post, patchPostDetail(detail(), "a", true));
  });

  it("restores the snapshot on error and refreshes once settled", async () => {
    const harness = createCacheHarness();
    const handlers = createLikeMutationHandlers(harness.cache, "b", false);

    const snapshot = await handlers.onMutate();
    assert.deepEqual(harness.feed, patchFeedPages(feed(), "b", false));

    handlers.onError(new Error("offline"), { postId: "b" }, snapshot);
    assert.deepEqual(harness.feed, feed());
    assert.deepEqual(harness.post, detail());

    handlers.onSettled();
    assert.equal(harness.refreshCount, 1);
  });

  it("does nothing on error without a snapshot", () => {
    const harness = createCacheHarness();
    const handlers = createLikeMutationHandlers(harness.cache, "a", true);
    // oxlint-disable-next-line unicorn/no-useless-undefined -- the snapshot parameter is required, mirroring TanStack's onError
    handlers.onError(new Error("offline"), { postId: "a" }, undefined);
    assert.deepEqual(harness.feed, feed());
  });
});
