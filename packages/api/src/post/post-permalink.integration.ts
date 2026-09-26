import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, like, post, user } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { callerFor, createCaller } from "../test-utils";
import { FLAG_HIDE_THRESHOLD } from "./post-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const MINUTE_MS = 60 * 1000;

/** A letter with three replies from three different commenters, a minute apart.
    The replies are INSERTED newest first, so the physical row order disagrees
    with `createdAt` from the start. */
const createFixture = async () => {
  const authorId = randomUUID();
  const readerId = randomUUID();
  const commenterIds = [randomUUID(), randomUUID(), randomUUID()];
  const userIds = [authorId, readerId, ...commenterIds];
  const letterId = randomUUID();
  const updatedAt = new Date().toISOString();
  const now = Date.now();

  await db.insert(user).values(userIds.map((id) => ({ displayName: "Permalink", id })));
  await db.insert(post).values({
    content: "A letter people keep replying to",
    createdBy: "Author",
    id: letterId,
    updatedAt,
    userId: authorId,
  });

  // Oldest first: index 0 is the first reply written.
  const replies = commenterIds.map((userId, index) => ({
    content: `Reply number ${index}`,
    createdAt: new Date(now - (commenterIds.length - index) * MINUTE_MS).toISOString(),
    createdBy: "Commenter",
    id: randomUUID(),
    parentId: letterId,
    updatedAt,
    userId,
  }));
  await db.insert(post).values(replies.toReversed());

  const cleanup = async () => {
    const postIds = [letterId, ...replies.map((reply) => reply.id)];
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(block).where(inArray(block.blockerId, userIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return {
    anonymous: createCaller(null),
    authorId,
    cleanup,
    commenterIds,
    letterId,
    reader: await callerFor(readerId),
    replyIds: replies.map((reply) => reply.id),
  };
};

integrationTest("comments are served oldest first, and a like does not reorder them", async () => {
  const fixture = await createFixture();
  try {
    const [firstReplyId] = fixture.replyIds;
    assert.ok(firstReplyId);
    // The counter trigger UPDATEs the liked comment's row, which is what can
    // move it to the end of the physical order.
    await fixture.reader.like.createLike({ postId: firstReplyId });

    const { post: served } = await fixture.reader.post.getPost({ postId: fixture.letterId });

    assert.deepEqual(
      served.comments?.map((comment) => comment.id),
      fixture.replyIds,
    );
    assert.equal(served.comments?.[0]?.isLiked, true);
    assert.equal(served.comments?.[0]?.likeCount, 1);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a blocked commenter's reply is neither served nor counted", async () => {
  const fixture = await createFixture();
  try {
    const [, blockedId] = fixture.commenterIds;
    assert.ok(blockedId);
    await fixture.reader.block.createBlock({ blockingId: blockedId });

    const { post: forReader } = await fixture.reader.post.getPost({ postId: fixture.letterId });
    assert.deepEqual(
      forReader.comments?.map((comment) => comment.id),
      [fixture.replyIds[0], fixture.replyIds[2]],
    );
    assert.equal(forReader.commentCount, 2);

    // Only the blocker's view changes.
    const { post: forAnyone } = await fixture.anonymous.post.getPost({
      postId: fixture.letterId,
    });
    assert.equal(forAnyone.commentCount, 3);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a letter by an author the viewer blocked is NOT_FOUND to them alone", async () => {
  const fixture = await createFixture();
  try {
    await fixture.reader.block.createBlock({ blockingId: fixture.authorId });

    await assert.rejects(
      fixture.reader.post.getPost({ postId: fixture.letterId }),
      (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
    );
    const { post: forAnyone } = await fixture.anonymous.post.getPost({
      postId: fixture.letterId,
    });
    assert.equal(forAnyone.id, fixture.letterId);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a reply flagged into hiding leaves the permalink", async () => {
  const fixture = await createFixture();
  try {
    const hiddenId = fixture.replyIds.at(-1);
    assert.ok(hiddenId);
    await db
      .update(post)
      .set({ flagCount: FLAG_HIDE_THRESHOLD + 1 })
      .where(eq(post.id, hiddenId));

    const { post: served } = await fixture.anonymous.post.getPost({ postId: fixture.letterId });
    assert.deepEqual(
      served.comments?.map((comment) => comment.id),
      fixture.replyIds.slice(0, 2),
    );
    assert.equal(served.commentCount, 2);
  } finally {
    await fixture.cleanup();
  }
});
