import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray, or, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, flag, like, notification, post, token, user } from "@repo/db/drizzle-schema";

import { callerFor, runWithoutCookieScope } from "../test-utils";

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

  const [drift] = rows;
  assert.ok(drift);
  assert.deepEqual(
    {
      comment: Number(drift.comment_drift),
      flag: Number(drift.flag_drift),
      like: Number(drift.like_drift),
    },
    { comment: 0, flag: 0, like: 0 },
    `counter drift after ${label}`,
  );
};

const counters = async (postId: string) => {
  const row = await db.query.post.findFirst({
    columns: { commentCount: true, flagCount: true, likeCount: true },
    where: { id: postId },
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
    { createdAt: aged, displayName: "Owner", id: ownerId },
    { displayName: "Flagger", email: `${flaggerId}@example.com`, id: flaggerId },
  ]);
  await db.insert(post).values({
    content: "A letter with counters to keep straight",
    createdAt: aged,
    createdBy: "Owner",
    id: rootId,
    updatedAt,
    userId: ownerId,
  });

  const ownerCaller = await callerFor(ownerId);
  const flaggerCaller = await callerFor(flaggerId);

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

  return { cleanup, flaggerCaller, flaggerId, ownerCaller, ownerId, rootId };
};

integrationTest("counters survive like, unlike, flag and comment", async () => {
  const fixture = await createFixture();
  try {
    await assertNoDrift("seed");

    await fixture.flaggerCaller.like.createLike({ postId: fixture.rootId });
    const afterLike = await counters(fixture.rootId);
    assert.equal(afterLike?.likeCount, 1);
    await assertNoDrift("like");

    await fixture.flaggerCaller.like.deleteLike({ postId: fixture.rootId });
    const afterUnlike = await counters(fixture.rootId);
    assert.equal(afterUnlike?.likeCount, 0);
    await assertNoDrift("unlike");

    await fixture.flaggerCaller.flag.createFlag({ postId: fixture.rootId });
    // The flagger is registered, so this flag carries authority and IS counted.
    const afterFlag = await counters(fixture.rootId);
    assert.equal(afterFlag?.flagCount, 1);
    await assertNoDrift("flag");

    await fixture.flaggerCaller.post.createPost({
      content: "A comment on the letter",
      parentId: fixture.rootId,
    });
    const afterComment = await counters(fixture.rootId);
    assert.equal(afterComment?.commentCount, 1);
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
    await db.insert(user).values({ displayName: "Fresh", id: freshId });
    const freshCaller = await callerFor(freshId);

    await freshCaller.flag.createFlag({ postId: fixture.rootId });

    // The Flag row exists, but flagCount — the thing that hides posts — did not move.
    const flags = await db
      .select()
      .from(flag)
      .where(and(eq(flag.postId, fixture.rootId), eq(flag.userId, freshId)));
    assert.equal(flags.length, 1);
    const afterFreshFlag = await counters(fixture.rootId);
    assert.equal(afterFreshFlag?.flagCount, 0);
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
      content: "A comment that will be cascaded away",
      parentId: fixture.rootId,
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
    await db.insert(user).values({ displayName: "Survivor", id: survivorId });
    await db.insert(post).values({
      content: "A letter by someone who is staying",
      createdBy: "Survivor",
      id: survivorPostId,
      updatedAt: new Date().toISOString(),
      userId: survivorId,
    });

    await fixture.flaggerCaller.like.createLike({ postId: survivorPostId });
    await fixture.flaggerCaller.flag.createFlag({ postId: survivorPostId });
    await fixture.flaggerCaller.post.createPost({
      content: "A comment that leaves with its author",
      parentId: survivorPostId,
    });

    const before = await counters(survivorPostId);
    assert.deepEqual(
      { comment: before?.commentCount, flag: before?.flagCount, like: before?.likeCount },
      { comment: 1, flag: 1, like: 1 },
    );

    await runWithoutCookieScope(() => fixture.flaggerCaller.user.deleteUser());

    const afterDelete = await counters(survivorPostId);
    assert.deepEqual(
      {
        comment: afterDelete?.commentCount,
        flag: afterDelete?.flagCount,
        like: afterDelete?.likeCount,
      },
      { comment: 0, flag: 0, like: 0 },
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

type Caller = Awaited<ReturnType<typeof callerFor>>;

/** Replies to `parentId`, then to that reply, and so on: one level per caller. */
const replyChain = async (parentId: string, repliers: Caller[]) => {
  const ids: string[] = [];
  let replyTo = parentId;
  for (const replier of repliers) {
    const { post: reply } = await replier.post.createPost({
      content: `A reply ${ids.length + 1} deep`,
      parentId: replyTo,
    });
    assert.ok(reply);
    ids.push(reply.id);
    replyTo = reply.id;
  }
  return ids;
};

/** Every row that hangs off these posts, by table. */
const rowsOn = async (postIds: string[]) => {
  const [posts, likes, flags, notifications] = await Promise.all([
    db.select({ id: post.id }).from(post).where(inArray(post.id, postIds)),
    db.select().from(like).where(inArray(like.postId, postIds)),
    db.select().from(flag).where(inArray(flag.postId, postIds)),
    db
      .select({ id: notification.id })
      .from(notification)
      .where(or(inArray(notification.postId, postIds), inArray(notification.commentId, postIds))),
  ]);
  return {
    flags: flags.length,
    likes: likes.length,
    notifications: notifications.length,
    posts: posts.length,
  };
};

/** A registered third user, whose flags count, plus a letter of their own. */
const createReader = async () => {
  const readerId = randomUUID();
  const readerPostId = randomUUID();
  await db
    .insert(user)
    .values({ displayName: "Reader", email: `${readerId}@example.com`, id: readerId });
  await db.insert(post).values({
    content: "A letter by a reader",
    createdBy: "Reader",
    id: readerPostId,
    updatedAt: new Date().toISOString(),
    userId: readerId,
  });

  const cleanup = async () => {
    await db.delete(post).where(eq(post.userId, readerId));
    await db.delete(like).where(eq(like.userId, readerId));
    await db.delete(flag).where(eq(flag.userId, readerId));
    await db.delete(block).where(or(eq(block.blockerId, readerId), eq(block.blockingId, readerId)));
    await db.delete(user).where(eq(user.id, readerId));
  };

  return { cleanup, readerCaller: await callerFor(readerId), readerId, readerPostId };
};

integrationTest("deletePost takes a 3-deep reply thread and every row under it", async () => {
  const fixture = await createFixture();
  const reader = await createReader();
  try {
    // A letter outside the thread, with a like, a flag and a reply of its own.
    await fixture.flaggerCaller.like.createLike({ postId: reader.readerPostId });
    await fixture.flaggerCaller.flag.createFlag({ postId: reader.readerPostId });
    await fixture.ownerCaller.post.createPost({
      content: "A reply outside the thread",
      parentId: reader.readerPostId,
    });
    const bystanderBefore = await counters(reader.readerPostId);
    const bystanderRowsBefore = await rowsOn([reader.readerPostId]);

    // Each level has a different author, so the cascade crosses owners.
    const threadIds = [
      fixture.rootId,
      ...(await replyChain(fixture.rootId, [
        fixture.flaggerCaller,
        reader.readerCaller,
        fixture.ownerCaller,
      ])),
    ];
    for (const postId of threadIds) {
      await fixture.flaggerCaller.like.createLike({ postId });
      await reader.readerCaller.like.createLike({ postId });
      await fixture.flaggerCaller.flag.createFlag({ postId });
      await reader.readerCaller.flag.createFlag({ postId });
    }
    assert.deepEqual(await rowsOn(threadIds), { flags: 8, likes: 8, notifications: 3, posts: 4 });
    await assertNoDrift("before thread delete");

    assert.deepEqual(await fixture.ownerCaller.post.deletePost({ postId: fixture.rootId }), {
      post: { id: fixture.rootId },
    });

    assert.deepEqual(await rowsOn(threadIds), { flags: 0, likes: 0, notifications: 0, posts: 0 });
    assert.deepEqual(await counters(reader.readerPostId), bystanderBefore);
    assert.deepEqual(await rowsOn([reader.readerPostId]), bystanderRowsBefore);
    await assertNoDrift("thread delete");
  } finally {
    await reader.cleanup();
    await fixture.cleanup();
  }
});

integrationTest("deleting a reply takes only its subtree", async () => {
  const fixture = await createFixture();
  try {
    await fixture.ownerCaller.like.createLike({ postId: fixture.rootId });
    const [replyId, ...below] = await replyChain(fixture.rootId, [
      fixture.flaggerCaller,
      fixture.ownerCaller,
      fixture.flaggerCaller,
    ]);
    assert.ok(replyId);
    for (const postId of [replyId, ...below]) {
      await fixture.ownerCaller.like.createLike({ postId });
    }

    await fixture.flaggerCaller.post.deletePost({ postId: replyId });

    assert.deepEqual(await rowsOn([replyId, ...below]), {
      flags: 0,
      likes: 0,
      notifications: 0,
      posts: 0,
    });
    assert.deepEqual(await counters(fixture.rootId), {
      commentCount: 0,
      flagCount: 0,
      likeCount: 1,
    });
    await assertNoDrift("reply delete");
  } finally {
    await fixture.cleanup();
  }
});

integrationTest(
  "deleteUser takes their threads, blocks and tokens, and no one else's",
  async () => {
    const fixture = await createFixture();
    const reader = await createReader();
    const leaverId = fixture.flaggerId;
    const leaver = fixture.flaggerCaller;
    try {
      // The leaver's own letter, with a thread that interleaves them and others.
      const { post: letter } = await leaver.post.createPost({ content: "A letter that leaves" });
      assert.ok(letter);
      const letterThread = [
        letter.id,
        ...(await replyChain(letter.id, [fixture.ownerCaller, leaver, reader.readerCaller])),
      ];
      // A comment on someone else's letter, answered by a third user.
      const commentThread = await replyChain(fixture.rootId, [leaver, reader.readerCaller]);
      const leavingIds = [...letterThread, ...commentThread];
      for (const postId of leavingIds) {
        await fixture.ownerCaller.like.createLike({ postId });
        await reader.readerCaller.flag.createFlag({ postId });
      }
      await leaver.like.createLike({ postId: fixture.rootId });
      await leaver.flag.createFlag({ postId: fixture.rootId });
      await leaver.like.createLike({ postId: reader.readerPostId });
      await leaver.block.createBlock({ blockingId: reader.readerId });
      await fixture.ownerCaller.block.createBlock({ blockingId: leaverId });
      await db
        .insert(token)
        .values({ token: randomUUID(), type: "RESET_PASSWORD", userId: leaverId });

      await runWithoutCookieScope(() => leaver.user.deleteUser());

      const [leaverRows, blocks, tokens, survivors] = await Promise.all([
        db.select({ id: user.id }).from(user).where(eq(user.id, leaverId)),
        db
          .select()
          .from(block)
          .where(or(eq(block.blockerId, leaverId), eq(block.blockingId, leaverId))),
        db.select({ id: token.id }).from(token).where(eq(token.userId, leaverId)),
        db
          .select({ id: user.id })
          .from(user)
          .where(inArray(user.id, [fixture.ownerId, reader.readerId])),
      ]);
      assert.deepEqual(
        {
          blocks: blocks.length,
          leaver: leaverRows.length,
          survivors: survivors.length,
          tokens: tokens.length,
        },
        { blocks: 0, leaver: 0, survivors: 2, tokens: 0 },
      );
      assert.deepEqual(await rowsOn(leavingIds), {
        flags: 0,
        likes: 0,
        notifications: 0,
        posts: 0,
      });
      assert.deepEqual(await counters(fixture.rootId), {
        commentCount: 0,
        flagCount: 0,
        likeCount: 0,
      });
      assert.deepEqual(await counters(reader.readerPostId), {
        commentCount: 0,
        flagCount: 0,
        likeCount: 0,
      });
      await assertNoDrift("deleteUser thread cascade");
    } finally {
      await reader.cleanup();
      await fixture.cleanup();
    }
  },
);
