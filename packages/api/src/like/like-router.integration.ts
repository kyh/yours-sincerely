import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { like, post, user } from "@repo/db/drizzle-schema";

import { ORPCError } from "@orpc/server";

import { callerFor } from "../test-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const BASE_LIKE_COUNT = 5;

/** One letter with a seeded offset and one like already on it, so the returned
    count has to add both. */
const createFixture = async () => {
  const likerId = randomUUID();
  const otherLikerId = randomUUID();
  const authorId = randomUUID();
  const userIds = [likerId, otherLikerId, authorId];
  const postId = randomUUID();

  await db.insert(user).values([
    { displayName: "Liker", id: likerId },
    { displayName: "Other liker", id: otherLikerId },
    { displayName: "Author", id: authorId },
  ]);
  await db.insert(post).values({
    baseLikeCount: BASE_LIKE_COUNT,
    content: "A letter someone is about to like, long enough to count.",
    createdBy: "Author",
    id: postId,
    updatedAt: new Date().toISOString(),
    userId: authorId,
  });
  await db.insert(like).values({
    postId,
    updatedAt: new Date().toISOString(),
    userId: otherLikerId,
  });

  const caller = await callerFor(likerId);

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.userId, userIds));
    await db.delete(post).where(eq(post.id, postId));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return { authorId, caller, cleanup, postId };
};

const isNotFound = (error: Error) => error instanceof ORPCError && error.code === "NOT_FOUND";

integrationTest("createLike returns the post's new like state, counted like the feed", async () => {
  const fixture = await createFixture();
  try {
    const first = await fixture.caller.like.createLike({ postId: fixture.postId });
    assert.deepEqual(first.post, {
      id: fixture.postId,
      isLiked: true,
      likeCount: BASE_LIKE_COUNT + 2,
    });
    assert.ok(first.like);

    const repeat = await fixture.caller.like.createLike({ postId: fixture.postId });
    assert.deepEqual(repeat.post, first.post);

    const feed = await fixture.caller.post.getFeed({ userId: fixture.authorId });
    const inFeed = feed.posts.find((entry) => entry.id === fixture.postId);
    assert.ok(inFeed);
    assert.equal(inFeed.likeCount, first.post.likeCount);
    assert.equal(inFeed.isLiked, true);

    const detail = await fixture.caller.post.getPost({ postId: fixture.postId });
    assert.equal(detail.post.likeCount, first.post.likeCount);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("deleteLike returns the post's new like state", async () => {
  const fixture = await createFixture();
  try {
    await fixture.caller.like.createLike({ postId: fixture.postId });

    const removed = await fixture.caller.like.deleteLike({ postId: fixture.postId });
    assert.deepEqual(removed.post, {
      id: fixture.postId,
      isLiked: false,
      likeCount: BASE_LIKE_COUNT + 1,
    });
    assert.ok(removed.like);

    const repeat = await fixture.caller.like.deleteLike({ postId: fixture.postId });
    assert.deepEqual(repeat.post, removed.post);
    assert.equal(repeat.like, undefined);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("liking or unliking a deleted letter is NOT_FOUND, not a 500", async () => {
  const fixture = await createFixture();
  try {
    await db.delete(like).where(eq(like.postId, fixture.postId));
    await db.delete(post).where(eq(post.id, fixture.postId));

    await assert.rejects(fixture.caller.like.createLike({ postId: fixture.postId }), isNotFound);
    await assert.rejects(fixture.caller.like.deleteLike({ postId: fixture.postId }), isNotFound);

    const rows = await db.select().from(like).where(eq(like.postId, fixture.postId));
    assert.equal(rows.length, 0);
  } finally {
    await fixture.cleanup();
  }
});
