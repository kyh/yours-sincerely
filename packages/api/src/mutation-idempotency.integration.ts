import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, flag, like, post, user } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { callerFor } from "./test-utils";

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
    { displayName: "Actor", id: actorId },
    { displayName: "Author", id: authorId },
  ]);
  await db.insert(post).values({
    content: "A letter worth double-tapping",
    createdBy: "Author",
    id: postId,
    updatedAt,
    userId: authorId,
  });

  const caller = await callerFor(actorId);

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.postId, [postId]));
    await db.delete(flag).where(inArray(flag.postId, [postId]));
    await db.delete(block).where(inArray(block.blockerId, [actorId, authorId]));
    await db.delete(post).where(inArray(post.id, [postId]));
    await db.delete(user).where(inArray(user.id, [actorId, authorId]));
  };

  return { actorId, authorId, caller, cleanup, postId };
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

/** The author deleting a letter while someone else still has it on screen is an
    ordinary race, not a server fault. */
integrationTest("flagging or replying to a deleted letter is NOT_FOUND, not a 500", async () => {
  const fixture = await createFixture();
  try {
    await db.delete(post).where(eq(post.id, fixture.postId));

    await assert.rejects(
      fixture.caller.flag.createFlag({ postId: fixture.postId }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
    await assert.rejects(
      fixture.caller.post.createPost({
        content: "A reply to a letter that is gone",
        parentId: fixture.postId,
      }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );

    const orphans = await db.select().from(post).where(eq(post.userId, fixture.actorId));
    assert.equal(orphans.length, 0);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("blocking an account that does not exist is NOT_FOUND", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      fixture.caller.block.createBlock({ blockingId: randomUUID() }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
  } finally {
    await fixture.cleanup();
  }
});

/** No client reads these payloads. Anything wider hands out server-owned state:
    a flag's `countsTowardHide`, a letter's `flagCount` and `baseLikeCount`. */
integrationTest("mutations hand back only the keys they mean to", async () => {
  const fixture = await createFixture();
  try {
    assert.deepEqual(await fixture.caller.flag.createFlag({ postId: fixture.postId }), {
      flag: { postId: fixture.postId },
    });

    const { post: created } = await fixture.caller.post.createPost({
      content: "A reply that will not last long",
      parentId: fixture.postId,
    });
    assert.ok(created);
    assert.deepEqual(Object.keys(created).toSorted(), ["createdBy", "id", "parentId", "userId"]);

    assert.deepEqual(await fixture.caller.post.deletePost({ postId: created.id }), {
      post: { id: created.id },
    });
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("blocking yourself is rejected", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      fixture.caller.block.createBlock({ blockingId: fixture.actorId }),
      /You cannot block yourself/u,
    );

    const rows = await db.select().from(block).where(eq(block.blockerId, fixture.actorId));
    assert.equal(rows.length, 0);
  } finally {
    await fixture.cleanup();
  }
});
