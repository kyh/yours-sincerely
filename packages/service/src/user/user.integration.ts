import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { like, post, user } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { callerFor, createCaller } from "../test-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

/** An author with a seeded letter, a plain letter and a reply of their own, and
    two readers who like some of them. */
const createFixture = async () => {
  const authorId = randomUUID();
  const readerIds = [randomUUID(), randomUUID()];
  const userIds = [authorId, ...readerIds];
  const [seededId, plainId, replyId] = [randomUUID(), randomUUID(), randomUUID()];
  const postIds = [seededId, plainId, replyId];
  const updatedAt = new Date().toISOString();

  await db.insert(user).values(userIds.map((id) => ({ displayName: "Stats", id })));
  await db.insert(post).values([
    {
      baseLikeCount: 7,
      content: "A letter carried over with a seeded like offset",
      id: seededId,
      updatedAt,
      userId: authorId,
    },
    { content: "A plain letter", id: plainId, updatedAt, userId: authorId },
  ]);
  await db.insert(post).values({
    content: "The author answering their own letter",
    id: replyId,
    parentId: plainId,
    updatedAt,
    userId: authorId,
  });

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return { authorId, cleanup, postIds, readerIds, replyId, seededId };
};

integrationTest("totalLikeCount matches a ground-truth count of Like rows", async () => {
  const fixture = await createFixture();
  try {
    for (const readerId of fixture.readerIds) {
      const reader = await callerFor(readerId);
      await reader.like.createLike({ postId: fixture.seededId });
      await reader.like.createLike({ postId: fixture.replyId });
    }

    const [truth] = await db.execute(sql`
      SELECT
        (SELECT COALESCE(SUM(COALESCE(p."baseLikeCount", 0)), 0) FROM "Post" p
          WHERE p."userId" = ${fixture.authorId})
        + (SELECT COUNT(*) FROM "Like" l JOIN "Post" p ON p."id" = l."postId"
          WHERE p."userId" = ${fixture.authorId}) AS total
    `);
    assert.ok(truth);
    assert.equal(Number(truth.total), 7 + 4);

    const { userStats } = await createCaller(null).user.getUserStats({
      userId: fixture.authorId,
    });
    assert.ok(userStats);
    assert.equal(userStats.totalLikeCount, Number(truth.total));
    assert.equal(userStats.totalPostCount, fixture.postIds.length);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("getUserStats answers undefined for a user that does not exist", async () => {
  const { userStats } = await createCaller(null).user.getUserStats({ userId: randomUUID() });
  assert.equal(userStats, undefined);
});

integrationTest("taking an email another account holds is CONFLICT, not a 500", async () => {
  const fixture = await createFixture();
  const email = `${fixture.authorId}@example.com`;
  try {
    await db.update(user).set({ email }).where(eq(user.id, fixture.authorId));
    const [readerId] = fixture.readerIds;
    assert.ok(readerId);
    const reader = await callerFor(readerId);

    await assert.rejects(
      reader.user.updateUser({ email }),
      (error) => error instanceof ORPCError && error.code === "CONFLICT",
    );
  } finally {
    await fixture.cleanup();
  }
});
