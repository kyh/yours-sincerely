import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { block, notification, post, pushToken, user } from "@repo/db/drizzle-schema";
import {
  NOTIFICATION_PREVIEW_MAX_CHARS,
  UNREAD_COUNT_CAP,
} from "@repo/contract/notification/notification-schema";
import { PUSH_TOKEN_MAX_IDLE_DAYS } from "@repo/contract/push/push-schema";
import { ORPCError } from "@orpc/server";

import { signPushCleanupCapability } from "./auth/push-cleanup-capability";
import { FLAG_HIDE_THRESHOLD } from "./post/post-utils";
import { findLivePushTokens } from "./push/expo-push";
import { callerFor, runWithoutCookieScope } from "./test-utils";

const skip = process.env.RUN_DB_TESTS === "1" ? false : "RUN_DB_TESTS is unset";

after(async () => {
  await db.$client.end();
});

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const createFixture = async () => {
  const authorId = randomUUID();
  const commenterId = randomUUID();
  const letterId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values([
    { displayName: "Author", id: authorId },
    { displayName: "Commenter", id: commenterId },
  ]);
  await db.insert(post).values({
    content: "A letter that will be replied to",
    createdBy: "Author",
    id: letterId,
    updatedAt,
    userId: authorId,
  });

  const cleanup = async () => {
    await db.delete(block).where(inArray(block.blockerId, [authorId, commenterId]));
    await db.delete(post).where(inArray(post.userId, [authorId, commenterId]));
    await db.delete(user).where(inArray(user.id, [authorId, commenterId]));
  };

  return {
    author: await callerFor(authorId),
    authorId,
    cleanup,
    commenter: await callerFor(commenterId),
    commenterId,
    letterId,
    updatedAt,
  };
};

const seedNotifications = async (
  fixture: Awaited<ReturnType<typeof createFixture>>,
  count: number,
) => {
  const now = Date.now();

  const comments = Array.from({ length: count }, (_, index) => ({
    content: `Reply number ${index}`,
    createdBy: "Commenter",
    id: randomUUID(),
    parentId: fixture.letterId,
    updatedAt: fixture.updatedAt,
    userId: fixture.commenterId,
  }));

  await db.insert(post).values(comments);

  const rows = comments.map((comment, index) => ({
    actorName: "Commenter",
    commentId: comment.id,
    createdAt: new Date(now - index * MINUTE_MS).toISOString(),
    id: randomUUID(),
    kind: "COMMENT" as const,
    postId: fixture.letterId,
    userId: fixture.authorId,
  }));

  await db.insert(notification).values(rows);

  return rows;
};

test("a reply notifies the letter's author with a preview", { skip }, async () => {
  const fixture = await createFixture();

  try {
    const content = `${"x".repeat(NOTIFICATION_PREVIEW_MAX_CHARS)} and the rest of the reply`;

    const { post: reply } = await fixture.commenter.post.createPost({
      content,
      createdBy: "Commenter",
      parentId: fixture.letterId,
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
    assert.deepEqual(await fixture.commenter.notification.unreadCount(), { count: 0 });
  } finally {
    await fixture.cleanup();
  }
});

test("replying to your own letter creates no notification", { skip }, async () => {
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

test("a reply from someone the author blocked is never stored", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await fixture.author.block.createBlock({ blockingId: fixture.commenterId });

    const { post: reply } = await fixture.commenter.post.createPost({
      content: "Words the author asked never to see",
      parentId: fixture.letterId,
    });

    assert.ok(reply);

    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
    const listed = await fixture.author.notification.list({});
    assert.equal(listed.notifications.length, 0);

    const stored = await db
      .select({ id: notification.id })
      .from(notification)
      .where(eq(notification.commentId, reply.id));

    assert.equal(stored.length, 0);
  } finally {
    await fixture.cleanup();
  }
});

test(
  "blocking the commenter afterwards hides the reply from list and badge",
  { skip },
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
      const whileBlocked = await fixture.author.notification.list({});
      assert.equal(whileBlocked.notifications.length, 0);

      await fixture.author.block.deleteBlock({ blockingId: fixture.commenterId });
      assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });
      const afterUnblock = await fixture.author.notification.list({});
      assert.equal(afterUnblock.notifications.length, 1);
    } finally {
      await fixture.cleanup();
    }
  },
);

test("a reply flagged into hiding leaves list and badge", { skip }, async () => {
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
    const listed = await fixture.author.notification.list({});
    assert.equal(listed.notifications.length, 0);
  } finally {
    await fixture.cleanup();
  }
});

test(
  "a letter flagged into hiding takes its notifications off list and badge",
  { skip },
  async () => {
    const fixture = await createFixture();

    try {
      await fixture.commenter.post.createPost({
        content: "A reply to a letter the community will hide",
        parentId: fixture.letterId,
      });
      assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 1 });

      await db
        .update(post)
        .set({ flagCount: FLAG_HIDE_THRESHOLD + 1 })
        .where(eq(post.id, fixture.letterId));

      await assert.rejects(
        fixture.author.post.getPost({ postId: fixture.letterId }),
        (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
      );
      assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 0 });
      const listed = await fixture.author.notification.list({});
      assert.equal(listed.notifications.length, 0);
    } finally {
      await fixture.cleanup();
    }
  },
);

test("the unread badge stops counting at the cap", { skip }, async () => {
  const fixture = await createFixture();

  try {
    await seedNotifications(fixture, UNREAD_COUNT_CAP + 5);

    assert.deepEqual(await fixture.author.notification.unreadCount(), {
      count: UNREAD_COUNT_CAP,
    });
  } finally {
    await fixture.cleanup();
  }
});

test("list is newest first and the cursor pages without gaps", { skip }, async () => {
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

    const second = await fixture.author.notification.list({ cursor: first.nextCursor, limit: 2 });
    assert.deepEqual(
      second.notifications.map((row) => row.id),
      expectedIds.slice(2, 4),
    );
    assert.ok(second.nextCursor);

    const third = await fixture.author.notification.list({ cursor: second.nextCursor, limit: 2 });
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

test("rows sharing a timestamp page by id, without gaps or repeats", { skip }, async () => {
  const fixture = await createFixture();

  try {
    const seeded = await seedNotifications(fixture, 3);
    const sharedAt = new Date().toISOString();
    await db
      .update(notification)
      .set({ createdAt: sharedAt })
      .where(eq(notification.userId, fixture.authorId));

    type Cursor = Awaited<ReturnType<typeof fixture.author.notification.list>>["nextCursor"];

    const listFrom: (cursor: Cursor) => Promise<string[]> = async (cursor) => {
      const page = await fixture.author.notification.list({ cursor, limit: 1 });

      const ids = page.notifications.map((row) => row.id);

      return page.nextCursor === undefined ? ids : [...ids, ...(await listFrom(page.nextCursor))];
    };

    const seen = await listFrom(undefined);

    const whole = await fixture.author.notification.list({});
    assert.deepEqual(
      seen,
      whole.notifications.map((row) => row.id),
    );
    assert.equal(new Set(seen).size, seeded.length);
  } finally {
    await fixture.cleanup();
  }
});

test("markRead by ids touches only those rows, and only mine", { skip }, async () => {
  const fixture = await createFixture();

  try {
    const seeded = await seedNotifications(fixture, 3);
    const [target] = seeded;
    assert.ok(target);

    assert.deepEqual(
      await fixture.commenter.notification.markRead({ ids: [target.id], scope: "ids" }),
      { updated: 0 },
    );

    assert.deepEqual(
      await fixture.author.notification.markRead({ ids: [target.id], scope: "ids" }),
      { updated: 1 },
    );
    assert.deepEqual(await fixture.author.notification.unreadCount(), { count: 2 });

    const { notifications } = await fixture.author.notification.list({});
    const readState = new Map(notifications.map((row) => [row.id, row.readAt !== null]));
    assert.equal(readState.get(target.id), true);
    assert.equal(readState.get(seeded[1]?.id ?? ""), false);
    assert.equal(readState.get(seeded[2]?.id ?? ""), false);

    assert.deepEqual(
      await fixture.author.notification.markRead({ ids: [target.id], scope: "ids" }),
      { updated: 0 },
    );
  } finally {
    await fixture.cleanup();
  }
});

test("markRead all clears the unread count", { skip }, async () => {
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

test("deleting the comment takes its notification with it", { skip }, async () => {
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

test("push.register upserts, and a token follows its latest user", { skip }, async () => {
  const fixture = await createFixture();
  const token = `ExponentPushToken[${randomUUID()}]`;

  try {
    await fixture.author.push.register({ platform: "ios", token });
    const [first] = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.ok(first);
    assert.equal(first.userId, fixture.authorId);
    assert.equal(first.platform, "ios");

    await fixture.author.push.register({ platform: "android", token });
    const rows = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.platform, "android");
    assert.ok((rows[0]?.lastSeenAt ?? "") >= first.lastSeenAt);

    await fixture.commenter.push.register({ platform: "android", token });
    const [moved] = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(moved?.userId, fixture.commenterId);

    const authorTokens = await db
      .select()
      .from(pushToken)
      .where(eq(pushToken.userId, fixture.authorId));

    assert.equal(authorTokens.length, 0);
  } finally {
    await db.delete(pushToken).where(eq(pushToken.token, token));
    await fixture.cleanup();
  }
});

test(
  "a token idle past the cut-off is dropped until the device registers again",
  { skip },
  async () => {
    const fixture = await createFixture();
    const token = `ExponentPushToken[${randomUUID()}]`;

    try {
      await fixture.author.push.register({ platform: "ios", token });
      assert.deepEqual(await findLivePushTokens(fixture.authorId), [token]);

      const idleSince = new Date(
        Date.now() - (PUSH_TOKEN_MAX_IDLE_DAYS + 1) * DAY_MS,
      ).toISOString();

      await db.update(pushToken).set({ lastSeenAt: idleSince }).where(eq(pushToken.token, token));
      assert.deepEqual(await findLivePushTokens(fixture.authorId), []);
      const dropped = await db.select().from(pushToken).where(eq(pushToken.token, token));
      assert.equal(dropped.length, 0);

      await fixture.author.push.register({ platform: "ios", token });
      assert.deepEqual(await findLivePushTokens(fixture.authorId), [token]);
    } finally {
      await db.delete(pushToken).where(eq(pushToken.token, token));
      await fixture.cleanup();
    }
  },
);

test("push.unregister honours only a genuine capability for my own token", { skip }, async () => {
  const fixture = await createFixture();
  const token = `ExponentPushToken[${randomUUID()}]`;

  try {
    await fixture.author.push.register({ platform: "ios", token });
    const { pushCleanupCapability } = await fixture.author.auth.workspace();
    assert.ok(pushCleanupCapability !== null && pushCleanupCapability !== "");

    const forged = signPushCleanupCapability(fixture.authorId, "not-the-server-secret");
    await assert.rejects(
      fixture.commenter.push.unregister({ capability: forged, token }),
      (error) => error instanceof ORPCError && error.code === "UNAUTHORIZED",
    );

    const { pushCleanupCapability: otherCapability } = await fixture.commenter.auth.workspace();
    assert.ok(otherCapability !== null && otherCapability !== "");
    await fixture.commenter.push.unregister({ capability: otherCapability, token });
    const afterForeign = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(afterForeign.length, 1);

    await fixture.commenter.push.unregister({ capability: pushCleanupCapability, token });
    const afterOwn = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(afterOwn.length, 0);
  } finally {
    await db.delete(pushToken).where(eq(pushToken.token, token));
    await fixture.cleanup();
  }
});

test("deleting the account cascades its notifications and tokens", { skip }, async () => {
  const fixture = await createFixture();
  const token = `ExponentPushToken[${randomUUID()}]`;

  try {
    await seedNotifications(fixture, 2);
    await fixture.author.push.register({ platform: "ios", token });

    await runWithoutCookieScope(async () => await fixture.author.user.deleteUser());

    const remainingNotifications = await db
      .select({ id: notification.id })
      .from(notification)
      .where(eq(notification.userId, fixture.authorId));

    assert.equal(remainingNotifications.length, 0);
    const remainingTokens = await db.select().from(pushToken).where(eq(pushToken.token, token));
    assert.equal(remainingTokens.length, 0);
  } finally {
    await db.delete(pushToken).where(eq(pushToken.token, token));
    await fixture.cleanup();
  }
});
