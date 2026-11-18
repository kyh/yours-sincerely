import type { ORPCContext } from "../orpc";
import { alias, and, count, desc, eq, inArray, isNull, sql } from "@repo/db";
import { notification, post } from "@repo/db/drizzle-schema";
import {
  NOTIFICATION_PAGE_SIZE,
  NOTIFICATION_PREVIEW_MAX_CHARS,
  UNREAD_COUNT_CAP,
} from "@repo/contract/notification/notification-schema";

import { os, requireUser } from "../orpc";
import { postVisibleTo } from "../post/post-utils";

const previewOf = (content: string) =>
  [...content].slice(0, NOTIFICATION_PREVIEW_MAX_CHARS).join("");

const letter = alias(post, "letter");

const notificationVisibleTo = (db: ORPCContext["db"], viewerId: string) =>
  and(postVisibleTo(db, viewerId, post), postVisibleTo(db, viewerId, letter));

const authed = os.notification.use(requireUser);

export const notificationRouter = {
  list: authed.list.handler(async ({ context, input }) => {
    const limit = input.limit ?? NOTIFICATION_PAGE_SIZE;

    const rows = await context.db
      .select({
        actorName: notification.actorName,
        commentId: notification.commentId,
        content: post.content,
        createdAt: notification.createdAt,
        id: notification.id,
        kind: notification.kind,
        postId: notification.postId,
        readAt: notification.readAt,
      })
      .from(notification)
      .innerJoin(post, eq(post.id, notification.commentId))
      .innerJoin(letter, eq(letter.id, notification.postId))
      .where(
        and(
          eq(notification.userId, context.user.id),
          notificationVisibleTo(context.db, context.user.id),
          input.cursor
            ? sql`(${notification.createdAt}, ${notification.id}) < (${input.cursor.createdAt}, ${input.cursor.notificationId})`
            : undefined,
        ),
      )
      .orderBy(desc(notification.createdAt), desc(notification.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageItems = hasMore ? rows.slice(0, limit) : rows;

    const notifications = pageItems.map(({ content, ...row }) => ({
      ...row,
      preview: previewOf(content),
    }));

    const lastItem = pageItems.at(-1);

    const nextCursor =
      hasMore && lastItem
        ? { createdAt: lastItem.createdAt, notificationId: lastItem.id }
        : undefined;

    return { nextCursor, notifications };
  }),

  markRead: authed.markRead.handler(async ({ context, input }) => {
    const updated = await context.db
      .update(notification)
      .set({ readAt: new Date().toISOString() })
      .where(
        and(
          eq(notification.userId, context.user.id),
          isNull(notification.readAt),
          input.scope === "ids" ? inArray(notification.id, input.ids) : undefined,
        ),
      )
      .returning({ id: notification.id });

    return { updated: updated.length };
  }),

  unreadCount: authed.unreadCount.handler(async ({ context }) => {
    const unread = context.db
      .select({ id: notification.id })
      .from(notification)
      .innerJoin(post, eq(post.id, notification.commentId))
      .innerJoin(letter, eq(letter.id, notification.postId))
      .where(
        and(
          eq(notification.userId, context.user.id),
          isNull(notification.readAt),
          notificationVisibleTo(context.db, context.user.id),
        ),
      )
      .limit(UNREAD_COUNT_CAP)
      .as("unread");

    const [row] = await context.db.select({ count: count() }).from(unread);

    return { count: row?.count ?? 0 };
  }),
};
