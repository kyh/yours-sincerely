import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, like, post, user } from "@repo/db/drizzle-schema";

import { createCaller } from "../test-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const SEEDED_POST_COUNT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Eight root posts by one author, one hour apart, newest first. Every read is
    filtered by `userId` so the fixture is isolated from anything else in the DB. */
const createFixture = async () => {
  const authorId = randomUUID();
  const readerId = randomUUID();
  const updatedAt = new Date().toISOString();
  const now = Date.now();

  await db.insert(user).values([
    { displayName: "Feed author", id: authorId },
    { displayName: "Feed reader", id: readerId },
  ]);

  // Newest first: index 0 is the most recent.
  const posts = Array.from({ length: SEEDED_POST_COUNT }, (_, index) => ({
    content: `Feed letter number ${index}`,
    createdAt: new Date(now - index * 60 * 60 * 1000).toISOString(),
    createdBy: "Feed author",
    id: randomUUID(),
    updatedAt,
    userId: authorId,
  }));
  await db.insert(post).values(posts);

  const postIds = posts.map((row) => row.id);

  const reader = await db.query.user.findFirst({
    columns: { passwordHash: false },
    where: { id: readerId },
  });
  assert.ok(reader);

  const caller = createCaller(reader);

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(flag).where(inArray(flag.postId, postIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, [authorId, readerId]));
  };

  return { authorId, caller, cleanup, now, postIds, posts, readerId, updatedAt };
};

integrationTest("getFeed returns exactly the requested page size", async () => {
  const fixture = await createFixture();
  try {
    const page = await fixture.caller.post.getFeed({ limit: 5, userId: fixture.authorId });

    // The sentinel row used to detect a next page must not be served.
    assert.equal(page.posts.length, 5);
    assert.ok(page.nextCursor);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("getFeed pages through the cursor without duplicates or gaps", async () => {
  const fixture = await createFixture();
  try {
    const first = await fixture.caller.post.getFeed({ limit: 5, userId: fixture.authorId });
    assert.ok(first.nextCursor);

    const lastOfFirst = first.posts.at(-1);
    assert.ok(lastOfFirst);
    // The cursor points at a row the client has SEEN, not at an unseen peek row.
    assert.equal(first.nextCursor.postId, lastOfFirst.id);

    const second = await fixture.caller.post.getFeed({
      cursor: first.nextCursor,
      limit: 5,
      userId: fixture.authorId,
    });

    assert.equal(second.posts.length, SEEDED_POST_COUNT - 5);
    assert.equal(second.nextCursor, undefined);

    const seen = [...first.posts, ...second.posts].map((row) => row.id);
    assert.equal(new Set(seen).size, SEEDED_POST_COUNT);
    // Newest-first, and every seeded post appears exactly once.
    assert.deepEqual(seen, fixture.postIds);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("getFeed only serves root posts, never comments", async () => {
  const fixture = await createFixture();
  const [parent] = fixture.posts;
  assert.ok(parent);
  const commentId = randomUUID();
  try {
    await db.insert(post).values({
      content: "A comment that must never reach the feed",
      createdAt: new Date(fixture.now).toISOString(),
      createdBy: "Feed author",
      id: commentId,
      parentId: parent.id,
      updatedAt: fixture.updatedAt,
      userId: fixture.authorId,
    });

    const page = await fixture.caller.post.getFeed({ limit: 50, userId: fixture.authorId });
    assert.equal(page.posts.length, SEEDED_POST_COUNT);
    assert.equal(
      page.posts.some((row) => row.id === commentId),
      false,
    );
  } finally {
    await db.delete(post).where(inArray(post.id, [commentId]));
    await fixture.cleanup();
  }
});

/** Characterization: the counters the feed exposes. These values must survive
    the denormalization of `likeCount`/`commentCount` onto `Post`. */
integrationTest("getFeed reports like, comment and isLiked exactly", async () => {
  const fixture = await createFixture();
  const [liked, commented] = fixture.posts;
  assert.ok(liked);
  assert.ok(commented);
  const commentIds = [randomUUID(), randomUUID()];
  try {
    await db.insert(post).values(
      commentIds.map((id, index) => ({
        content: `Reply number ${index}`,
        createdAt: new Date(fixture.now - DAY_MS).toISOString(),
        createdBy: "Feed reader",
        id,
        parentId: commented.id,
        updatedAt: fixture.updatedAt,
        userId: fixture.readerId,
      })),
    );
    await db.insert(like).values([
      { postId: liked.id, updatedAt: fixture.updatedAt, userId: fixture.readerId },
      { postId: liked.id, updatedAt: fixture.updatedAt, userId: fixture.authorId },
    ]);

    const page = await fixture.caller.post.getFeed({ limit: 50, userId: fixture.authorId });
    const byId = new Map(page.posts.map((row) => [row.id, row]));

    const likedRow = byId.get(liked.id);
    assert.ok(likedRow);
    assert.equal(likedRow.likeCount, 2);
    assert.equal(likedRow.isLiked, true);
    assert.equal(likedRow.commentCount, 0);

    const commentedRow = byId.get(commented.id);
    assert.ok(commentedRow);
    assert.equal(commentedRow.commentCount, 2);
    assert.equal(commentedRow.likeCount, 0);
    assert.equal(commentedRow.isLiked, false);
  } finally {
    await db.delete(post).where(inArray(post.id, commentIds));
    await fixture.cleanup();
  }
});
