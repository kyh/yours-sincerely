import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "../root-router";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const callerFor = async (userId: string) => {
  const actor = await db.query.user.findFirst({
    where: (row, { eq: equals }) => equals(row.id, userId),
    columns: { passwordHash: false },
  });
  assert.ok(actor);
  return appRouter.createCaller({ headers: new Headers(), user: actor, db });
};

/** Two blockers (A, B) and two authors (C, D). C has a post, so the feed can be
    checked before and after an unblock. */
const createFixture = async () => {
  const blockerAId = randomUUID();
  const blockerBId = randomUUID();
  const authorCId = randomUUID();
  const authorDId = randomUUID();
  const userIds = [blockerAId, blockerBId, authorCId, authorDId];
  const postByCId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values([
    { id: blockerAId, displayName: "Blocker A" },
    { id: blockerBId, displayName: "Blocker B" },
    { id: authorCId, displayName: "Author C" },
    { id: authorDId, displayName: "Author D" },
  ]);
  await db.insert(post).values([
    {
      id: postByCId,
      content: "A letter written by author C, long enough to satisfy the content floor.",
      createdBy: "Author C",
      userId: authorCId,
      updatedAt,
    },
  ]);

  const [callerA, callerB] = await Promise.all([callerFor(blockerAId), callerFor(blockerBId)]);

  const cleanup = async () => {
    await db.delete(block).where(inArray(block.blockerId, userIds));
    await db.delete(post).where(eq(post.id, postByCId));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return { blockerAId, blockerBId, authorCId, authorDId, postByCId, callerA, callerB, cleanup };
};

const feedContainsPost = async (
  caller: Awaited<ReturnType<typeof callerFor>>,
  postId: string,
): Promise<boolean> => {
  const feed = await caller.post.getFeed({ limit: 50 });
  return feed.posts.some((entry) => entry.id === postId);
};

integrationTest("listBlocks returns only the caller's own blocks", async () => {
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

integrationTest("listBlocks requires an authenticated caller", async () => {
  const anonymous = appRouter.createCaller({ headers: new Headers(), user: null, db });
  await assert.rejects(anonymous.block.listBlocks(), /UNAUTHORIZED/);
});

integrationTest("deleteBlock cannot delete another user's block", async () => {
  // THE SECURITY CASE. A blocks C. B asks to delete a block on C. B's `where` is
  // scoped to B's own id, so A's block must survive untouched.
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

    // And A can still not see C's post — the block is genuinely still in force.
    assert.equal(await feedContainsPost(fixture.callerA, fixture.postByCId), false);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("deleteBlock requires an authenticated caller", async () => {
  const anonymous = appRouter.createCaller({ headers: new Headers(), user: null, db });
  await assert.rejects(anonymous.block.deleteBlock({ blockingId: randomUUID() }), /UNAUTHORIZED/);
});

integrationTest("unblocking makes the author's posts reappear in the feed", async () => {
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
    assert.deepEqual((await fixture.callerA.block.listBlocks()).blocks, []);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("block, unblock, and block again round-trips without error", async () => {
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

integrationTest("deleting a block the caller does not have is a no-op, not an error", async () => {
  const fixture = await createFixture();
  try {
    const result = await fixture.callerA.block.deleteBlock({ blockingId: fixture.authorDId });
    assert.equal(result.block, undefined);
  } finally {
    await fixture.cleanup();
  }
});
