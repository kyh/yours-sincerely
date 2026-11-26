import type { ORPCContext } from "../orpc";
import { and, desc, eq, sql } from "@repo/db";
import { feed, notification, post } from "@repo/db/drizzle-schema";
import { resolveDisplayName } from "@repo/contract/user/user-display";
import { describeNotification } from "@repo/contract/notification/notification-schema";
import { FEED_PAGE_SIZE } from "@repo/contract/post/post-schema";
import type { NewCommentNotificationData } from "@repo/contract/notification/notification-schema";
import { SITE } from "@repo/contract/site/site";
import { ORPCError } from "@orpc/server";

import { afterResponse } from "../after-response";
import { createUserIfNotExists } from "../auth/auth-utils";
import { os, requireUser } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";
import { sendPushToUser } from "../push/expo-push";
import { convertDbPostToFeedPost } from "./post-schema";
import { getPostHistoryFloor, notBlockedBy, postVisibleTo } from "./post-utils";

const findMyLikes = async (context: ORPCContext, postIds: string[]) => {
  const viewerId = context.user?.id;

  if (viewerId === undefined || viewerId === "" || postIds.length === 0) {
    return new Set();
  }

  const rows = await context.db.query.like.findMany({
    columns: { postId: true },
    where: { postId: { in: postIds }, userId: viewerId },
  });

  return new Set(rows.map((row) => row.postId));
};

const authed = os.post.use(requireUser);

export const postRouter = {
  createPost: os.post.createPost.handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context, input.createdBy);

    const { created, reply } = await context.db.transaction(async (tx) => {
      const [inserted] = await rethrowPgError(
        tx
          .insert(post)
          .values({
            content: input.content,
            createdBy: resolveDisplayName(input.createdBy),
            parentId: input.parentId,
            userId,
          })
          .returning({
            createdBy: post.createdBy,
            id: post.id,
            parentId: post.parentId,
            userId: post.userId,
          }),
        FOREIGN_KEY_VIOLATION,
        () => new ORPCError("NOT_FOUND", { message: "Post not found" }),
      );

      const parent =
        inserted !== undefined &&
        inserted.parentId !== undefined &&
        inserted.parentId !== null &&
        inserted.parentId !== ""
          ? await tx.query.post.findFirst({
              columns: { id: true, userId: true },
              where: { id: inserted.parentId ?? "" },
            })
          : undefined;

      if (!inserted || !parent || parent.userId === inserted.userId) {
        return { created: inserted, reply: null };
      }

      const blocked = await tx.query.block.findFirst({
        columns: { blockerId: true },
        where: { blockerId: parent.userId, blockingId: inserted.userId },
      });

      if (blocked) {
        return { created: inserted, reply: null };
      }

      const actorName = resolveDisplayName(inserted.createdBy);

      await tx
        .insert(notification)
        .values({
          actorName,
          commentId: inserted.id,
          kind: "COMMENT",
          postId: parent.id,
          userId: parent.userId,
        })
        .onConflictDoNothing({ target: [notification.userId, notification.commentId] });

      return {
        created: inserted,
        reply: {
          actorName,
          commentPostId: inserted.id,
          parentPostId: parent.id,
          recipientId: parent.userId,
        },
      };
    });

    if (reply) {
      await afterResponse(async () => {
        await sendPushToUser({
          body: describeNotification({ actorName: reply.actorName, kind: "COMMENT" }),
          data: {
            commentPostId: reply.commentPostId,
            parentPostId: reply.parentPostId,
          } satisfies NewCommentNotificationData,
          title: SITE.name,
          userId: reply.recipientId,
        });
      });
    }

    return {
      post: created,
    };
  }),

  deletePost: authed.deletePost.handler(async ({ context, input }) => {
    const [deleted] = await context.db
      .delete(post)
      .where(and(eq(post.id, input.postId), eq(post.userId, context.user.id)))
      .returning({ id: post.id });

    if (deleted === undefined) {
      throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    }

    return {
      post: deleted,
    };
  }),

  getFeed: os.post.getFeed.handler(async ({ context, input }) => {
    const limit = input.limit ?? FEED_PAGE_SIZE;

    const feedPosts = await context.db
      .select()
      .from(feed)
      .where(
        and(
          notBlockedBy(context.db, context.user?.id, feed.userId),
          // WARNING: a row comparison, not an OR: Postgres seeks an index to a row bound but only filters an OR.
          input.cursor
            ? sql`(${feed.createdAt}, ${feed.id}) < (${input.cursor.createdAt}, ${input.cursor.postId})`
            : undefined,
          input.userId !== undefined && input.userId !== ""
            ? eq(feed.userId, input.userId)
            : undefined,
        ),
      )
      .orderBy(desc(feed.createdAt), desc(feed.id))
      .limit(limit + 1);

    const hasMore = feedPosts.length > limit;
    const pageItems = hasMore ? feedPosts.slice(0, limit) : feedPosts;

    const myLikes = await findMyLikes(
      context,
      pageItems.map((item) => item.id),
    );

    const posts = pageItems.map((item) => ({
      ...item,
      isLiked: myLikes.has(item.id),
    }));

    const lastItem = pageItems.at(-1);

    const nextCursor =
      hasMore && lastItem ? { createdAt: lastItem.createdAt, postId: lastItem.id } : undefined;

    return {
      nextCursor,
      posts,
    };
  }),

  getPost: os.post.getPost.handler(async ({ context, input }) => {
    const visible = (row: typeof post) => postVisibleTo(context.db, context.user?.id, row);

    const dbPost = await context.db.query.post.findFirst({
      where: { RAW: visible, id: input.postId },
      with: {
        posts: { orderBy: { createdAt: "asc", id: "asc" }, where: { RAW: visible } },
      },
    });

    if (!dbPost) {
      throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    }

    const { posts: comments } = dbPost;
    const myLikes = await findMyLikes(context, [dbPost.id, ...comments.map((row) => row.id)]);

    return {
      post: {
        ...convertDbPostToFeedPost(dbPost, {
          commentCount: comments.length,
          isLiked: myLikes.has(dbPost.id),
        }),
        comments: comments.map((comment) =>
          convertDbPostToFeedPost(comment, {
            commentCount: 0,
            isLiked: myLikes.has(comment.id),
          }),
        ),
      },
    };
  }),

  /** Feeds the profile heatmap and the day-of-week histogram, both of which need
      only dates. It is public and takes an arbitrary `userId`, so it must not
      hand out post IDs: that turned any author into an enumerable archive of
      every letter they ever wrote, permalink by permalink. Dates only. */
  getPostsByUser: os.post.getPostsByUser.handler(async ({ context, input }) => {
    const posts = await context.db.query.post.findMany({
      columns: {
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      where: { createdAt: { gte: getPostHistoryFloor() }, userId: input.userId },
    });

    return { posts };
  }),
};
