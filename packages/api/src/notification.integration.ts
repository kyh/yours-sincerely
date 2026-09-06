import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, notification, post, pushToken, user } from "@repo/db/drizzle-schema";
import { NOTIFICATION_PREVIEW_MAX_CHARS } from "@repo/contracts/notifications";
import { ORPCError } from "@orpc/server";

import { signPushCleanupCapability } from "./auth/push-cleanup-capability";
import { FLAG_HIDE_THRESHOLD } from "./post/post-utils";
import { findLivePushTokens } from "./push/expo-push";
import { PUSH_TOKEN_MAX_IDLE_DAYS } from "./push/expo-push-core";
import { callerFor } from "./test-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** `deleteUser` clears the session cookie via `next/headers`, which throws outside
    a Next request scope. Every database effect runs BEFORE that write, so the
    mutation is driven for real and only that one specific error is absorbed.
    Same helper as `post/post-counters.integration.ts`. */
const runWithoutCookieScope = async <T>(operation: () => Promise<T>) => {
  try {
    await operation();
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("outside a request scope"))) throw error;
  }
};

/** An author with one letter, and a second user who will reply to it. Every
    read is scoped to these two users, so the fixture is isolated from anything
    else in the database. */
const createFixture = async () => {
  const authorId = randomUUID();
  const commenterId = randomUUID();
  const letterId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values([
    { id: authorId, displayName: "Author" },
    { id: commenterId, displayName: "Commenter" },
  ]);
  await db.insert(post).values({
    id: letterId,
    content: "A letter that will be replied to",
    createdBy: "Author",
    userId: authorId,
    updatedAt,
  });

  const cleanup = async () => {
    // Notifications cascade from the posts and push tokens from the users; the
    // Block FKs restrict, so blocks go first. One statement for the posts, so
    // the self-referential parentId FK is checked after the letter and its
    // replies are gone together.
    await db.delete(block).where(inArray(block.blockerId, [authorId, commenterId]));
    await db.delete(post).where(inArray(post.userId, [authorId, commenterId]));
    await db.delete(user).where(inArray(user.id, [authorId, commenterId]));
  };

  return {
    authorId,
    commenterId,
    letterId,
    updatedAt,
    author: await callerFor(authorId),
    commenter: await callerFor(commenterId),
    cleanup,
  };
};

/** Direct rows with explicit timestamps, so ordering tests do not depend on
    the wall clock ticking between two `createPost` calls. */
const seedNotifications = async (
  fixture: Awaited<ReturnType<typeof createFixture>>,
  count: number,
) => {
  const now = Date.now();
  const comments = Array.from({ length: count }, (_, index) => ({
    id: randomUUID(),
    content: `Reply number ${index}`,
    createdBy: "Commenter",
    parentId: fixture.letterId,
    userId: fixture.commenterId,
    updatedAt: fixture.updatedAt,
  }));
  await db.insert(post).values(comments);

  // Newest first: index 0 is the most recent.
  const rows = comments.map((comment, index) => ({
    id: randomUUID(),
    userId: fixture.authorId,
    kind: "COMMENT" as const,
    postId: fixture.letterId,
    commentId: comment.id,
    actorName: "Commenter",
    createdAt: new Date(now - index * MINUTE_MS).toISOString(),
  }));
  await db.insert(notification).values(rows);

  return rows;
};

integrationTest("a reply notifies the letter's author with a preview", async () => {
  const fixture = await createFixture();
  try {
    const content = `${"x".repeat(NOTIFICATION_PREVIEW_MAX_CHARS)} and the rest of the reply`;
    const { post: reply } = await fixture.commenter.post.createPost({
      content,
      parentId: fixture.letterId,
      createdBy: "Commenter",
    });
    assert.ok(reply);

    const { notifications, nextCursor } = await fixture.author.notification.list({});
    assert.equal(nextCursor, undefined);
    assert.equal(notifications.length, 1);
    const [row] = notifications;
    assert.ok(row);
    assert.equal(row.kind, "COMMENT");
    assert.equal(row.postId, fixture.letterId);
    assert.equal(row.commentId, reply.id);
    assert.equal(row.actorName, "Commenter");
    assert.equal(row.readAt, null);
    assert.equal(row.preview, "x".repeat(NOTIFICATION_PREVIEW_MAX_CHARS));

    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });
    // The commenter hears nothing about their own reply.
    assert.deepEqual(await fixture.commenter.notification.unreadCount(), { count: 0 });
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("replying to your own letter creates no notification", async () => {
  const fixture = await createFixture();
  try {
    await fixture.author.post.createPost({
      content: "Talking to myself in the margins",
      parentId: fixture.letterId,
    });

    const { notifications } = await fixture.author.notification.list({});
    assert.equal(notifications.length, 0);
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a reply from someone the author blocked is never stored", async () => {
  const fixture = await createFixture();
  try {
    await fixture.author.block.createBlock({ blockingId: fixture.commenterId });
    const { post: reply } = await fixture.commenter.post.createPost({
      content: "Words the author asked never to see",
      parentId: fixture.letterId,
    });
    assert.ok(reply);

    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
    assert.equal((await fixture.author.notification.list({})).notifications.length, 0);
    // No row at all, not merely a hidden one: nothing to push from either.
    assert.equal(
      (
        await db
          .select({ id: notification.id })
          .from(notification)
          .where(eq(notification.commentId, reply.id))
      ).length,
      0,
    );
  } finally {
    await fixture.cleanup();
  }
});

integrationTest(
  "blocking the commenter afterwards hides the reply from list and badge",
  async () => {
    const fixture = await createFixture();
    try {
      await fixture.commenter.post.createPost({
        content: "Landed before the block",
        parentId: fixture.letterId,
      });
      assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });

      await fixture.author.block.createBlock({ blockingId: fixture.commenterId });
      assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
      assert.equal((await fixture.author.notification.list({})).notifications.length, 0);

      await fixture.author.block.deleteBlock({ blockingId: fixture.commenterId });
      assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });
      assert.equal((await fixture.author.notification.list({})).notifications.length, 1);
    } finally {
      await fixture.cleanup();
    }
  },
);

integrationTest("a reply flagged into hiding leaves list and badge", async () => {
  const fixture = await createFixture();
  try {
    const { post: reply } = await fixture.commenter.post.createPost({
      content: "The community will hide this",
      parentId: fixture.letterId,
    });
    assert.ok(reply);
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });

    await db
      .update(post)
      .set({ flagCount: FLAG_HIDE_THRESHOLD + 1 })
      .where(eq(post.id, reply.id));

    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
    assert.equal((await fixture.author.notification.list({})).notifications.length, 0);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("list is newest first and the cursor pages without gaps", async () => {
  const fixture = await createFixture();
  try {
    const seeded = await seedNotifications(fixture, 5);
    const expectedIds = seeded.map((row) => row.id);

    const first = await fixture.author.notification.list({ limit: 2 });
    assert.deepEqual(
      first.notifications.map((row) => row.id),
      expectedIds.slice(0, 2),
    );
    assert.ok(first.nextCursor);
    assert.equal(first.nextCursor.notificationId, expectedIds[1]);

    const second = await fixture.author.notification.list({ limit: 2, cursor: first.nextCursor });
    assert.deepEqual(
      second.notifications.map((row) => row.id),
      expectedIds.slice(2, 4),
    );
    assert.ok(second.nextCursor);

    const third = await fixture.author.notification.list({ limit: 2, cursor: second.nextCursor });
    assert.deepEqual(
      third.notifications.map((row) => row.id),
      expectedIds.slice(4),
    );
    assert.equal(third.nextCursor, undefined);

    const whole = await fixture.author.notification.list({});
    assert.deepEqual(
      whole.notifications.map((row) => row.id),
      expectedIds,
    );
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("markRead by ids touches only those rows, and only mine", async () => {
  const fixture = await createFixture();
  try {
    const seeded = await seedNotifications(fixture, 3);
    const [target] = seeded;
    assert.ok(target);

    // Someone else naming my notification ids marks nothing.
    assert.deepEqual(
      await fixture.commenter.notification.markRead({ scope: "ids", ids: [target.id] }),
      { updated: 0 },
    );

    assert.deepEqual(
      await fixture.author.notification.markRead({ scope: "ids", ids: [target.id] }),
      { updated: 1 },
    );
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 2 });

    const { notifications } = await fixture.author.notification.list({});
    const readState = new Map(notifications.map((row) => [row.id, row.readAt !== null]));
    assert.equal(readState.get(target.id), true);
    assert.equal(readState.get(seeded[1]?.id ?? ""), false);
    assert.equal(readState.get(seeded[2]?.id ?? ""), false);

    // Already read: a repeat is a no-op, not a second timestamp.
    assert.deepEqual(
      await fixture.author.notification.markRead({ scope: "ids", ids: [target.id] }),
      { updated: 0 },
    );
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("markRead all clears the unread count", async () => {
  const fixture = await createFixture();
  try {
    await seedNotifications(fixture, 3);
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 3 });

    assert.deepEqual(await fixture.author.notification.markRead({ scope: "all" }), {
      updated: 3,
    });
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
    assert.deepEqual(await fixture.author.notification.markRead({ scope: "all" }), {
      updated: 0,
    });

    const { notifications } = await fixture.author.notification.list({});
    assert.equal(notifications.length, 3);
    assert.ok(notifications.every((row) => row.readAt !== null));
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("deleting the comment takes its notification with it", async () => {
  const fixture = await createFixture();
  try {
    const { post: reply } = await fixture.commenter.post.createPost({
      content: "A reply the commenter will think better of",
      parentId: fixture.letterId,
    });
    assert.ok(reply);
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });

    await fixture.commenter.post.deletePost({ postId: reply.id });

    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
    const { notifications } = await fixture.author.notification.list({});
    assert.equal(notifications.length, 0);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("push.register upserts, and a token follows its latest user", async () => {
  const fixture = await createFixture();
  const token = `ExponentPushToken[${randomUUID()}]`;
  try {
    await fixture.author.push.register({ token, platform: "ios" });
    const [first] = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.ok(first);
    assert.equal(first.userId, fixture.authorId);
    assert.equal(first.platform, "ios");

    await fixture.author.push.register({ token, platform: "android" });
    const rows = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.platform, "android");
    assert.ok((rows[0]?.lastSeenAt ?? "") >= first.lastSeenAt);

    await fixture.commenter.push.register({ token, platform: "android" });
    const [moved] = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(moved?.userId, fixture.commenterId);
    assert.equal(
      (await db.select().from(pushToken).where(eq(pushToken.userId, fixture.authorId))).length,
      0,
    );
  } finally {
    await db.delete(pushToken).where(eq(pushToken.token, token));
    await fixture.cleanup();
  }
});

integrationTest(
  "a token idle past the cut-off is dropped until the device registers again",
  async () => {
    const fixture = await createFixture();
    const token = `ExponentPushToken[${randomUUID()}]`;
    try {
      await fixture.author.push.register({ token, platform: "ios" });
      assert.deepEqual(await findLivePushTokens(fixture.authorId), [token]);

      const idleSince = new Date(
        Date.now() - (PUSH_TOKEN_MAX_IDLE_DAYS + 1) * DAY_MS,
      ).toISOString();
      await db.update(pushToken).set({ lastSeenAt: idleSince }).where(eq(pushToken.token, token));
      assert.deepEqual(await findLivePushTokens(fixture.authorId), []);
      assert.equal((await db.select().from(pushToken).where(eq(pushToken.token, token))).length, 0);

      await fixture.author.push.register({ token, platform: "ios" });
      assert.deepEqual(await findLivePushTokens(fixture.authorId), [token]);
    } finally {
      await db.delete(pushToken).where(eq(pushToken.token, token));
      await fixture.cleanup();
    }
  },
);

integrationTest("push.unregister honours only a genuine capability for my own token", async () => {
  const fixture = await createFixture();
  const token = `ExponentPushToken[${randomUUID()}]`;
  try {
    await fixture.author.push.register({ token, platform: "ios" });
    const { pushCleanupCapability } = await fixture.author.auth.workspace();
    assert.ok(pushCleanupCapability);

    const forged = signPushCleanupCapability(fixture.authorId, "not-the-server-secret");
    await assert.rejects(
      fixture.commenter.push.unregister({ capability: forged, token }),
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    );

    // A valid capability for a different user cannot delete my token.
    const { pushCleanupCapability: otherCapability } = await fixture.commenter.auth.workspace();
    assert.ok(otherCapability);
    await fixture.commenter.push.unregister({ capability: otherCapability, token });
    assert.equal((await db.select().from(pushToken).where(eq(pushToken.token, token))).length, 1);

    await fixture.commenter.push.unregister({ capability: pushCleanupCapability, token });
    assert.equal((await db.select().from(pushToken).where(eq(pushToken.token, token))).length, 0);
  } finally {
    await db.delete(pushToken).where(eq(pushToken.token, token));
    await fixture.cleanup();
  }
});

integrationTest("deleting the account cascades its notifications and tokens", async () => {
  const fixture = await createFixture();
  const token = `ExponentPushToken[${randomUUID()}]`;
  try {
    await seedNotifications(fixture, 2);
    await fixture.author.push.register({ token, platform: "ios" });

    await runWithoutCookieScope(() => fixture.author.user.deleteUser());

    assert.equal(
      (
        await db
          .select({ id: notification.id })
          .from(notification)
          .where(eq(notification.userId, fixture.authorId))
      ).length,
      0,
    );
    assert.equal((await db.select().from(pushToken).where(eq(pushToken.token, token))).length, 0);
  } finally {
    await db.delete(pushToken).where(eq(pushToken.token, token));
    await fixture.cleanup();
  }
});
