import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, flag, like, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "./root-router";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const createFixture = async () => {
  const actorId = randomUUID();
  const authorId = randomUUID();
  const postId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values([
    { id: actorId, displayName: "Actor" },
    { id: authorId, displayName: "Author" },
  ]);
  await db.insert(post).values({
    id: postId,
    content: "A letter worth double-tapping",
    createdBy: "Author",
    userId: authorId,
    updatedAt,
  });

  const actor = await db.query.user.findFirst({
    where: (row, { eq }) => eq(row.id, actorId),
    columns: { passwordHash: false },
  });
  assert.ok(actor);

  const caller = appRouter.createCaller({ headers: new Headers(), user: actor, db });

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.postId, [postId]));
    await db.delete(flag).where(inArray(flag.postId, [postId]));
    await db.delete(block).where(inArray(block.blockerId, [actorId, authorId]));
    await db.delete(post).where(inArray(post.id, [postId]));
    await db.delete(user).where(inArray(user.id, [actorId, authorId]));
  };

  return { actorId, authorId, postId, caller, cleanup };
};

integrationTest("liking the same post twice is a no-op, not a 500", async () => {
  const fixture = await createFixture();
  try {
    const first = await fixture.caller.like.createLike({ postId: fixture.postId });
    const second = await fixture.caller.like.createLike({ postId: fixture.postId });

    // The repeat call still returns the row — the client is never handed undefined.
    assert.ok(first.like);
    assert.ok(second.like);
    assert.equal(second.like.postId, fixture.postId);
    assert.equal(second.like.userId, fixture.actorId);

    const rows = await db
      .select()
      .from(like)
      .where(and(eq(like.postId, fixture.postId), eq(like.userId, fixture.actorId)));
    assert.equal(rows.length, 1);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("flagging the same post twice is a no-op, not a 500", async () => {
  const fixture = await createFixture();
  try {
    const first = await fixture.caller.flag.createFlag({ postId: fixture.postId });
    const second = await fixture.caller.flag.createFlag({ postId: fixture.postId });

    assert.ok(first.flag);
    assert.ok(second.flag);
    assert.equal(second.flag.postId, fixture.postId);

    const rows = await db
      .select()
      .from(flag)
      .where(and(eq(flag.postId, fixture.postId), eq(flag.userId, fixture.actorId)));
    assert.equal(rows.length, 1);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("blocking the same author twice is a no-op, not a 500", async () => {
  const fixture = await createFixture();
  try {
    const first = await fixture.caller.block.createBlock({ blockingId: fixture.authorId });
    const second = await fixture.caller.block.createBlock({ blockingId: fixture.authorId });

    assert.ok(first.block);
    assert.ok(second.block);
    assert.equal(second.block.blockingId, fixture.authorId);

    const rows = await db
      .select()
      .from(block)
      .where(and(eq(block.blockerId, fixture.actorId), eq(block.blockingId, fixture.authorId)));
    assert.equal(rows.length, 1);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("blocking yourself is rejected", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      fixture.caller.block.createBlock({ blockingId: fixture.actorId }),
      /You cannot block yourself/,
    );

    const rows = await db.select().from(block).where(eq(block.blockerId, fixture.actorId));
    assert.equal(rows.length, 0);
  } finally {
    await fixture.cleanup();
  }
});
