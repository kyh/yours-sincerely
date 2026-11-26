import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, post, user } from "@repo/db/drizzle-schema";

const skip = process.env.RUN_DB_TESTS === "1" ? false : "RUN_DB_TESTS is unset";

after(async () => {
  await db.$client.end();
});

const counters = async (postId: string) => {
  const [row] = await db
    .select({ commentCount: post.commentCount, flagCount: post.flagCount })
    .from(post)
    .where(eq(post.id, postId));

  assert.ok(row);

  return row;
};

const createFixture = async () => {
  const userId = randomUUID();
  const [firstId, secondId, commentId] = [randomUUID(), randomUUID(), randomUUID()];
  const updatedAt = new Date().toISOString();

  await db
    .insert(user)
    .values({ displayName: "Trigger author", email: `${userId}@example.com`, id: userId });
  await db.insert(post).values([
    { content: "First letter", id: firstId, updatedAt, userId },
    { content: "Second letter", id: secondId, updatedAt, userId },
  ]);
  await db
    .insert(post)
    .values({ content: "A reply", id: commentId, parentId: firstId, updatedAt, userId });

  const cleanup = async () => {
    await db.delete(flag).where(eq(flag.userId, userId));
    await db.delete(post).where(eq(post.id, commentId));
    await db.delete(post).where(inArray(post.id, [firstId, secondId]));
    await db.delete(user).where(eq(user.id, userId));
  };

  return { cleanup, commentId, firstId, secondId, updatedAt, userId };
};

test("reparenting a comment moves its count between parents", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await db.update(post).set({ parentId: fixture.secondId }).where(eq(post.id, fixture.commentId));

    const oldParent = await counters(fixture.firstId);
    const newParent = await counters(fixture.secondId);
    assert.equal(oldParent.commentCount, 0);
    assert.equal(newParent.commentCount, 1);
  } finally {
    await fixture.cleanup();
  }
});

const judgeUnjudgedFlags = (userId: string) =>
  db.execute(sql`
    UPDATE "Flag" SET "countsTowardHide" = public."isEstablishedFlagger"("userId")
    WHERE "countsTowardHide" IS NULL AND "userId" = ${userId}
  `);

test("judging an unjudged flag moves flagCount", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await db
      .insert(flag)
      .values({ postId: fixture.firstId, updatedAt: fixture.updatedAt, userId: fixture.userId });
    const afterFlag = await counters(fixture.firstId);
    assert.equal(afterFlag.flagCount, 1);

    await db.update(flag).set({ countsTowardHide: null }).where(eq(flag.userId, fixture.userId));
    const afterUnjudge = await counters(fixture.firstId);
    assert.equal(afterUnjudge.flagCount, 0);

    await judgeUnjudgedFlags(fixture.userId);
    const afterJudge = await counters(fixture.firstId);
    assert.equal(afterJudge.flagCount, 1);
  } finally {
    await fixture.cleanup();
  }
});
