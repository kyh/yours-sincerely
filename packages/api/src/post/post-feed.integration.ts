import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, like, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "../root-router";

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
    { id: authorId, displayName: "Feed author" },
    { id: readerId, displayName: "Feed reader" },
  ]);

  // Newest first: index 0 is the most recent.
  const posts = Array.from({ length: SEEDED_POST_COUNT }, (_, index) => ({
    id: randomUUID(),
    content: `Feed letter number ${index}`,
    createdBy: "Feed author",
    userId: authorId,
    createdAt: new Date(now - index * 60 * 60 * 1000).toISOString(),
    updatedAt,
  }));
  await db.insert(post).values(posts);

  const postIds = posts.map((row) => row.id);

  const reader = await db.query.user.findFirst({
    where: (row, { eq }) => eq(row.id, readerId),
    columns: { passwordHash: false },
  });
  assert.ok(reader);

  const caller = appRouter.createCaller({ headers: new Headers(), user: reader, db });

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(flag).where(inArray(flag.postId, postIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, [authorId, readerId]));
  };

  return { authorId, readerId, posts, postIds, caller, cleanup, updatedAt, now };
};

integrationTest("getFeed returns exactly the requested page size", async () => {
  const fixture = await createFixture();
  try {
    const page = await fixture.caller.post.getFeed({ userId: fixture.authorId, limit: 5 });

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
    const first = await fixture.caller.post.getFeed({ userId: fixture.authorId, limit: 5 });
    assert.ok(first.nextCursor);

    const lastOfFirst = first.posts.at(-1);
    assert.ok(lastOfFirst);
    // The cursor points at a row the client has SEEN, not at an unseen peek row.
    assert.equal(first.nextCursor.postId, lastOfFirst.id);

    const second = await fixture.caller.post.getFeed({
      userId: fixture.authorId,
      limit: 5,
      cursor: first.nextCursor,
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
  const parent = fixture.posts[0];
  assert.ok(parent);
  const commentId = randomUUID();
  try {
    await db.insert(post).values({
      id: commentId,
      content: "A comment that must never reach the feed",
      createdBy: "Feed author",
      parentId: parent.id,
      userId: fixture.authorId,
      createdAt: new Date(fixture.now).toISOString(),
      updatedAt: fixture.updatedAt,
    });

    const page = await fixture.caller.post.getFeed({ userId: fixture.authorId, limit: 50 });
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
  const liked = fixture.posts[0];
  const commented = fixture.posts[1];
  assert.ok(liked);
  assert.ok(commented);
  const commentIds = [randomUUID(), randomUUID()];
  try {
    await db.insert(post).values(
      commentIds.map((id, index) => ({
        id,
        content: `Reply number ${index}`,
        createdBy: "Feed reader",
        parentId: commented.id,
        userId: fixture.readerId,
        createdAt: new Date(fixture.now - DAY_MS).toISOString(),
        updatedAt: fixture.updatedAt,
      })),
    );
    await db.insert(like).values([
      { postId: liked.id, userId: fixture.readerId, updatedAt: fixture.updatedAt },
      { postId: liked.id, userId: fixture.authorId, updatedAt: fixture.updatedAt },
    ]);

    const page = await fixture.caller.post.getFeed({ userId: fixture.authorId, limit: 50 });
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
