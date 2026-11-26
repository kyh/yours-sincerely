import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray, or } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, post, user } from "@repo/db/drizzle-schema";

import { ORPCError } from "@orpc/server";

import { FOREIGN_KEY_VIOLATION, pgErrorCode } from "../pg-error";
import { callerFor, createCaller, runWithoutCookieScope } from "../test-utils";

const skip = process.env.RUN_DB_TESTS === "1" ? false : "RUN_DB_TESTS is unset";

after(async () => {
  await db.$client.end();
});

const createFixture = async () => {
  const blockerAId = randomUUID();
  const blockerBId = randomUUID();
  const authorCId = randomUUID();
  const authorDId = randomUUID();
  const userIds = [blockerAId, blockerBId, authorCId, authorDId];
  const postByCId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values([
    { displayName: "Blocker A", id: blockerAId },
    { displayName: "Blocker B", id: blockerBId },
    { displayName: "Author C", id: authorCId },
    { displayName: "Author D", id: authorDId },
  ]);
  await db.insert(post).values([
    {
      content: "A letter written by author C, long enough to satisfy the content floor.",
      createdBy: "Author C",
      id: postByCId,
      updatedAt,
      userId: authorCId,
    },
  ]);

  const [callerA, callerB] = await Promise.all([callerFor(blockerAId), callerFor(blockerBId)]);

  const cleanup = async () => {
    await db.delete(block).where(inArray(block.blockerId, userIds));
    await db.delete(post).where(eq(post.id, postByCId));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return { authorCId, authorDId, blockerAId, blockerBId, callerA, callerB, cleanup, postByCId };
};

const feedContainsPost = async (caller: Awaited<ReturnType<typeof callerFor>>, postId: string) => {
  const feed = await caller.post.getFeed({ limit: 50 });

  return feed.posts.some((entry) => entry.id === postId);
};

test("listBlocks returns only the caller's own blocks", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await fixture.callerA.block.createBlock({ blockingId: fixture.authorCId });
    await fixture.callerB.block.createBlock({ blockingId: fixture.authorDId });

    const listedByA = await fixture.callerA.block.listBlocks();
    assert.deepEqual(
      listedByA.blocks.map((row) => row.blockingId),
      [fixture.authorCId],
    );
    assert.equal(listedByA.blocks[0]?.displayName, "Author C");

    const listedByB = await fixture.callerB.block.listBlocks();
    assert.deepEqual(
      listedByB.blocks.map((row) => row.blockingId),
      [fixture.authorDId],
    );
  } finally {
    await fixture.cleanup();
  }
});

test("listBlocks requires an authenticated caller", { skip }, async () => {
  const anonymous = createCaller(null);
  await assert.rejects(
    anonymous.block.listBlocks(),
    (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
  );
});

test("deleteBlock cannot delete another user's block", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await fixture.callerA.block.createBlock({ blockingId: fixture.authorCId });

    const result = await fixture.callerB.block.deleteBlock({ blockingId: fixture.authorCId });
    assert.equal(result.block, undefined, "B had no such block to delete");

    const survivors = await db
      .select()
      .from(block)
      .where(and(eq(block.blockerId, fixture.blockerAId), eq(block.blockingId, fixture.authorCId)));

    assert.equal(survivors.length, 1, "A's block must NOT be deletable by B");

    assert.equal(await feedContainsPost(fixture.callerA, fixture.postByCId), false);
  } finally {
    await fixture.cleanup();
  }
});

test("deleteBlock requires an authenticated caller", { skip }, async () => {
  const anonymous = createCaller(null);
  await assert.rejects(
    anonymous.block.deleteBlock({ blockingId: randomUUID() }),
    (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
  );
});

test("unblocking makes the author's posts reappear in the feed", { skip }, async () => {
  const fixture = await createFixture();

  try {
    assert.equal(
      await feedContainsPost(fixture.callerA, fixture.postByCId),
      true,
      "baseline: C's post is visible before any block",
    );

    await fixture.callerA.block.createBlock({ blockingId: fixture.authorCId });
    assert.equal(await feedContainsPost(fixture.callerA, fixture.postByCId), false);

    const deleted = await fixture.callerA.block.deleteBlock({ blockingId: fixture.authorCId });
    assert.equal(deleted.block?.blockingId, fixture.authorCId);

    assert.equal(await feedContainsPost(fixture.callerA, fixture.postByCId), true);
    const listed = await fixture.callerA.block.listBlocks();
    assert.deepEqual(listed.blocks, []);
  } finally {
    await fixture.cleanup();
  }
});

test("block, unblock, and block again round-trips without error", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await fixture.callerA.block.createBlock({ blockingId: fixture.authorCId });
    await fixture.callerA.block.deleteBlock({ blockingId: fixture.authorCId });
    const reblocked = await fixture.callerA.block.createBlock({ blockingId: fixture.authorCId });

    assert.equal(reblocked.block?.blockerId, fixture.blockerAId);
    assert.equal(reblocked.block?.blockingId, fixture.authorCId);
    assert.equal(await feedContainsPost(fixture.callerA, fixture.postByCId), false);
  } finally {
    await fixture.cleanup();
  }
});

test("deleting a block the caller does not have is a no-op, not an error", { skip }, async () => {
  const fixture = await createFixture();

  try {
    const result = await fixture.callerA.block.deleteBlock({ blockingId: fixture.authorDId });
    assert.equal(result.block, undefined);
  } finally {
    await fixture.cleanup();
  }
});

test("Block restricts user deletion, and deleteUser clears both directions", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await fixture.callerA.block.createBlock({ blockingId: fixture.authorDId });
    await fixture.callerB.block.createBlock({ blockingId: fixture.blockerAId });

    await assert.rejects(
      db.delete(user).where(eq(user.id, fixture.authorDId)),
      (error) => pgErrorCode(error) === FOREIGN_KEY_VIOLATION,
    );

    await runWithoutCookieScope(async () => await fixture.callerA.user.deleteUser());

    const [blocks, users] = await Promise.all([
      db
        .select()
        .from(block)
        .where(
          or(eq(block.blockerId, fixture.blockerAId), eq(block.blockingId, fixture.blockerAId)),
        ),
      db
        .select({ id: user.id })
        .from(user)
        .where(inArray(user.id, [fixture.blockerAId, fixture.blockerBId, fixture.authorDId])),
    ]);

    assert.equal(blocks.length, 0);
    assert.deepEqual(
      users.map((row) => row.id).toSorted(),
      [fixture.authorDId, fixture.blockerBId].toSorted(),
    );
  } finally {
    await fixture.cleanup();
  }
});
