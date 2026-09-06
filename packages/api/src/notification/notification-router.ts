import type { ORPCContext } from "../orpc";
import { and, count, desc, eq, inArray, isNull, lt, lte, notExists, or, sql } from "@repo/db";
import { block, notification, post } from "@repo/db/drizzle-schema";
import {
  listNotificationsInput,
  markNotificationsReadInput,
  NOTIFICATION_PAGE_SIZE,
  NOTIFICATION_PREVIEW_MAX_CHARS,
} from "@repo/contracts/notifications";

import { protectedProcedure } from "../orpc";
import { FLAG_HIDE_THRESHOLD } from "../post/post-utils";

/** Code points, not UTF-16 units, so a cut never lands inside an emoji. */
const previewOf = (content: string) =>
  Array.from(content).slice(0, NOTIFICATION_PREVIEW_MAX_CHARS).join("");

/** The rules `post.getPost` applies before it shows a comment, on the joined
    `post` row: a preview must not carry words the recipient blocked or the
    community flagged into hiding, and the badge must not count a row the list
    will not show. */
const commentVisibleTo = (db: ORPCContext["db"], viewerId: string) =>
  and(
    notExists(
      db
        .select({ blocked: sql`1` })
        .from(block)
        .where(and(eq(block.blockerId, viewerId), eq(block.blockingId, post.userId))),
    ),
    lte(post.flagCount, FLAG_HIDE_THRESHOLD),
  );

export const notificationRouter = {
  list: protectedProcedure.input(listNotificationsInput).handler(async ({ context, input }) => {
    const limit = input.limit ?? NOTIFICATION_PAGE_SIZE;

    // Same keyset mechanics as `post.getFeed`: one sentinel row past the limit
    // says whether a next page exists, and it is sliced off before anything is
    // derived from the page.
    const rows = await context.db
      .select({
        id: notification.id,
        kind: notification.kind,
        postId: notification.postId,
        commentId: notification.commentId,
        actorName: notification.actorName,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        content: post.content,
      })
      .from(notification)
      // Inner: the comment FK cascades, so a notification without its comment
      // cannot exist.
      .innerJoin(post, eq(post.id, notification.commentId))
      .where(
        and(
          eq(notification.userId, context.user.id),
          commentVisibleTo(context.db, context.user.id),
          input.cursor
            ? or(
                lt(notification.createdAt, input.cursor.createdAt),
                and(
                  eq(notification.createdAt, input.cursor.createdAt),
                  lt(notification.id, input.cursor.notificationId),
                ),
              )
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
        ? { notificationId: lastItem.id, createdAt: lastItem.createdAt }
        : undefined;

    return { notifications, nextCursor };
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
    const [row] = await context.db
      .select({ count: count() })
      .from(notification)
      .innerJoin(post, eq(post.id, notification.commentId))
      .where(
        and(
          eq(notification.userId, context.user.id),
          isNull(notification.readAt),
          commentVisibleTo(context.db, context.user.id),
        ),
      );

    return { count: row?.count ?? 0 };
  }),
};
