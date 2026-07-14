import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, flag, like, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "../root-router";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

/** Denormalized counters drift. Drift is the failure mode of denormalization, and
    the first symptom is a wrong number on a popular post that nobody notices for
    weeks. This asserts the triggers agree with reality across the WHOLE table, so
    it catches a broken trigger no matter which row broke it. */
const assertNoDrift = async (label: string) => {
  const rows = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM "Post" p
        WHERE p."likeCount" <> (SELECT COUNT(*) FROM "Like" l WHERE l."postId" = p."id")) AS like_drift,
      (SELECT COUNT(*) FROM "Post" p
        WHERE p."flagCount" <> (SELECT COUNT(*) FROM "Flag" f WHERE f."postId" = p."id" AND f."countsTowardHide")) AS flag_drift,
      (SELECT COUNT(*) FROM "Post" p
        WHERE p."commentCount" <> (SELECT COUNT(*) FROM "Post" c WHERE c."parentId" = p."id")) AS comment_drift
  `);

  const drift = rows[0];
  assert.ok(drift);
  assert.deepEqual(
    {
      like: Number(drift.like_drift),
      flag: Number(drift.flag_drift),
      comment: Number(drift.comment_drift),
    },
    { like: 0, flag: 0, comment: 0 },
    `counter drift after ${label}`,
  );
};

/** `deleteUser` clears the session cookie via `next/headers`, which throws outside
    a Next request scope. Every database effect runs BEFORE that write, so the
    mutation is driven for real and only that one specific error is absorbed.
    Same helper as `auth/session-revocation.integration.ts`. */
const runWithoutCookieScope = async (operation: () => Promise<unknown>) => {
  try {
    await operation();
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("outside a request scope"))) throw error;
  }
};

const counters = async (postId: string) => {
  const row = await db.query.post.findFirst({
    where: (candidate, { eq }) => eq(candidate.id, postId),
    columns: { likeCount: true, commentCount: true, flagCount: true },
  });
  return row;
};

const createFixture = async () => {
  const ownerId = randomUUID();
  const flaggerId = randomUUID();
  const rootId = randomUUID();
  const updatedAt = new Date().toISOString();
  // Old enough, and about to own a post — an ESTABLISHED flagger, so its flag counts.
  const aged = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(user).values([
    { id: ownerId, displayName: "Owner", createdAt: aged },
    { id: flaggerId, displayName: "Flagger", email: `${flaggerId}@example.com` },
  ]);
  await db.insert(post).values({
    id: rootId,
    content: "A letter with counters to keep straight",
    createdBy: "Owner",
    userId: ownerId,
    createdAt: aged,
    updatedAt,
  });

  const owner = await db.query.user.findFirst({
    where: (row, { eq }) => eq(row.id, ownerId),
    columns: { passwordHash: false },
  });
  const flagger = await db.query.user.findFirst({
    where: (row, { eq }) => eq(row.id, flaggerId),
    columns: { passwordHash: false },
  });
  assert.ok(owner);
  assert.ok(flagger);

  const ownerCaller = appRouter.createCaller({ headers: new Headers(), user: owner, db });
  const flaggerCaller = appRouter.createCaller({ headers: new Headers(), user: flagger, db });

  const cleanup = async () => {
    const ids = await db
      .select({ id: post.id })
      .from(post)
      .where(inArray(post.userId, [ownerId, flaggerId]));
    const postIds = ids.map((row) => row.id);
    if (postIds.length > 0) {
      await db.delete(like).where(inArray(like.postId, postIds));
      await db.delete(flag).where(inArray(flag.postId, postIds));
      await db.delete(post).where(inArray(post.id, postIds));
    }
    await db.delete(block).where(inArray(block.blockerId, [ownerId, flaggerId]));
    await db.delete(user).where(inArray(user.id, [ownerId, flaggerId]));
  };

  return { ownerId, flaggerId, rootId, ownerCaller, flaggerCaller, cleanup };
};

integrationTest("counters survive like, unlike, flag and comment", async () => {
  const fixture = await createFixture();
  try {
    await assertNoDrift("seed");

    await fixture.flaggerCaller.like.createLike({ postId: fixture.rootId });
    assert.equal((await counters(fixture.rootId))?.likeCount, 1);
    await assertNoDrift("like");

    await fixture.flaggerCaller.like.deleteLike({ postId: fixture.rootId });
    assert.equal((await counters(fixture.rootId))?.likeCount, 0);
    await assertNoDrift("unlike");

    await fixture.flaggerCaller.flag.createFlag({ postId: fixture.rootId });
    // The flagger is registered, so this flag carries authority and IS counted.
    assert.equal((await counters(fixture.rootId))?.flagCount, 1);
    await assertNoDrift("flag");

    await fixture.flaggerCaller.post.createPost({
      parentId: fixture.rootId,
      content: "A comment on the letter",
    });
    assert.equal((await counters(fixture.rootId))?.commentCount, 1);
    await assertNoDrift("comment");
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a flag from a fresh identity moves no counter", async () => {
  const fixture = await createFixture();
  const freshId = randomUUID();
  try {
    // Brand new, no email, no posts — exactly what a cookieless request mints.
    await db.insert(user).values({ id: freshId, displayName: "Fresh" });
    const fresh = await db.query.user.findFirst({
      where: (row, { eq }) => eq(row.id, freshId),
      columns: { passwordHash: false },
    });
    assert.ok(fresh);
    const freshCaller = appRouter.createCaller({ headers: new Headers(), user: fresh, db });

    await freshCaller.flag.createFlag({ postId: fixture.rootId });

    // The Flag row exists, but flagCount — the thing that hides posts — did not move.
    const flags = await db
      .select()
      .from(flag)
      .where(and(eq(flag.postId, fixture.rootId), eq(flag.userId, freshId)));
    assert.equal(flags.length, 1);
    assert.equal((await counters(fixture.rootId))?.flagCount, 0);
    await assertNoDrift("fresh flag");
  } finally {
    await db.delete(flag).where(eq(flag.userId, freshId));
    await db.delete(user).where(eq(user.id, freshId));
    await fixture.cleanup();
  }
});

integrationTest("counters survive the deletePost bulk cascade", async () => {
  const fixture = await createFixture();
  try {
    const comment = await fixture.flaggerCaller.post.createPost({
      parentId: fixture.rootId,
      content: "A comment that will be cascaded away",
    });
    const commentId = comment.post?.id;
    assert.ok(commentId);

    await fixture.ownerCaller.like.createLike({ postId: commentId });
    await fixture.flaggerCaller.like.createLike({ postId: fixture.rootId });
    await fixture.flaggerCaller.flag.createFlag({ postId: fixture.rootId });
    await assertNoDrift("before cascade");

    // deletePost removes the parent AND its descendants in one statement — the
    // case where a naive statement-level trigger silently corrupts the counters.
    await fixture.ownerCaller.post.deletePost({ postId: fixture.rootId });

    const remaining = await db
      .select({ id: post.id })
      .from(post)
      .where(inArray(post.id, [fixture.rootId, commentId]));
    assert.equal(remaining.length, 0);
    await assertNoDrift("deletePost cascade");
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("counters survive the deleteUser bulk cascade", async () => {
  const fixture = await createFixture();
  const survivorId = randomUUID();
  const survivorPostId = randomUUID();
  try {
    // A post that OUTLIVES the deleted user, but that the deleted user has both
    // liked and commented on — its counters must come back down, not go stale.
    await db.insert(user).values({ id: survivorId, displayName: "Survivor" });
    await db.insert(post).values({
      id: survivorPostId,
      content: "A letter by someone who is staying",
      createdBy: "Survivor",
      userId: survivorId,
      updatedAt: new Date().toISOString(),
    });

    await fixture.flaggerCaller.like.createLike({ postId: survivorPostId });
    await fixture.flaggerCaller.flag.createFlag({ postId: survivorPostId });
    await fixture.flaggerCaller.post.createPost({
      parentId: survivorPostId,
      content: "A comment that leaves with its author",
    });

    const before = await counters(survivorPostId);
    assert.deepEqual(
      { like: before?.likeCount, flag: before?.flagCount, comment: before?.commentCount },
      { like: 1, flag: 1, comment: 1 },
    );

    await runWithoutCookieScope(() => fixture.flaggerCaller.user.deleteUser());

    const afterDelete = await counters(survivorPostId);
    assert.deepEqual(
      {
        like: afterDelete?.likeCount,
        flag: afterDelete?.flagCount,
        comment: afterDelete?.commentCount,
      },
      { like: 0, flag: 0, comment: 0 },
    );
    await assertNoDrift("deleteUser cascade");
  } finally {
    await db.delete(like).where(inArray(like.postId, [survivorPostId]));
    await db.delete(flag).where(inArray(flag.postId, [survivorPostId]));
    await db.delete(post).where(inArray(post.id, [survivorPostId]));
    await db.delete(user).where(inArray(user.id, [survivorId]));
    await fixture.cleanup();
  }
});
