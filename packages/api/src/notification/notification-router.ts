import type { ORPCContext } from "../orpc";
import { alias, and, count, desc, eq, inArray, isNull, sql } from "@repo/db";
import { notification, post } from "@repo/db/drizzle-schema";
import {
  listNotificationsInput,
  markNotificationsReadInput,
  NOTIFICATION_PAGE_SIZE,
  NOTIFICATION_PREVIEW_MAX_CHARS,
  UNREAD_COUNT_CAP,
} from "@repo/contracts/notifications";

import { protectedProcedure } from "../orpc";
import { postVisibleTo } from "../post/post-utils";

/** Code points, not UTF-16 units, so a cut never lands inside an emoji. */
const previewOf = (content: string) =>
  [...content].slice(0, NOTIFICATION_PREVIEW_MAX_CHARS).join("");

/** The letter a notification is about. `post` is joined as its comment. */
const letter = alias(post, "letter");

/** `post.getPost` must be willing to serve both the comment and its letter: a
    preview must not carry words the recipient blocked or the community flagged
    into hiding, a tap must not land on NOT_FOUND, and the badge must not count a
    row the list will not show. */
const notificationVisibleTo = (db: ORPCContext["db"], viewerId: string) =>
  and(postVisibleTo(db, viewerId, post), postVisibleTo(db, viewerId, letter));

export const notificationRouter = {
  list: protectedProcedure.input(listNotificationsInput).handler(async ({ context, input }) => {
    const limit = input.limit ?? NOTIFICATION_PAGE_SIZE;

    // Same keyset mechanics as `post.getFeed`: one sentinel row past the limit
    // says whether a next page exists, and it is sliced off before anything is
    // derived from the page.
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
      // Inner: the comment and letter FKs cascade, so a notification without
      // either cannot exist.
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

  markRead: protectedProcedure
    .input(markNotificationsReadInput)
    .handler(async ({ context, input }) => {
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

  unreadCount: protectedProcedure.handler(async ({ context }) => {
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
