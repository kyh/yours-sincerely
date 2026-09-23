import type { ORPCContext } from "../orpc";
import { and, desc, eq, sql } from "@repo/db";
import { feed, notification, post } from "@repo/db/drizzle-schema";
import { describeNotification } from "@repo/contracts/notifications";
import { FEED_PAGE_SIZE } from "@repo/contracts/post";
import type { NewCommentNotificationData } from "@repo/contracts/notifications";
import { SITE } from "@repo/contracts/site";
import { resolveDisplayName } from "@repo/contracts/user";
import { ORPCError } from "@orpc/server";

import { afterResponse } from "../after-response";
import { createUserIfNotExists } from "../auth/auth-utils";
import { protectedProcedure, publicProcedure } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";
import { sendPushToUser } from "../push/expo-push";
import {
  convertDbPostToFeedPost,
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
  getPostsByUserInput,
} from "./post-schema";
import { getPostHistoryFloor, notBlockedBy, postVisibleTo } from "./post-utils";

/** Which of these posts the viewer has liked. One indexed lookup over the ids on
    the page, instead of loading every `Like` row of every post to find out. */
const findMyLikes = async (context: ORPCContext, postIds: string[]): Promise<Set<string>> => {
  const viewerId = context.user?.id;
  if (!viewerId || postIds.length === 0) {
    return new Set();
  }

  const rows = await context.db.query.like.findMany({
    columns: { postId: true },
    where: { postId: { in: postIds }, userId: viewerId },
  });

  return new Set(rows.map((row) => row.postId));
};

export const postRouter = {
  createPost: publicProcedure.input(createPostInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context, input.createdBy);

    // The comment and its notification commit together: a letter author is
    // never told about a reply that failed to save, and never misses one that did.
    const { created, reply } = await context.db.transaction(async (tx) => {
      // The letter being replied to can be deleted while its reply form is open.
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

      const parent = inserted?.parentId
        ? await tx.query.post.findFirst({
            columns: { id: true, userId: true },
            where: { id: inserted.parentId ?? "" },
          })
        : undefined;

      if (!inserted || !parent || parent.userId === inserted.userId) {
        return { created: inserted, reply: null };
      }

      // A blocked commenter's words must never reach the person who blocked
      // them: `getPost` hides the reply, so the row would point at nothing and
      // the push would be the one channel the block did not cover.
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

    // After commit, best-effort, and off the response path: the comment is
    // saved, so a push Expo is slow to accept must neither fail it nor hold the
    // reply open until the client times out and posts the same comment twice.
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

  deletePost: protectedProcedure.input(deletePostInput).handler(async ({ context, input }) => {
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

  getFeed: publicProcedure.input(getFeedInput).handler(async ({ context, input }) => {
    const limit = input.limit ?? FEED_PAGE_SIZE;

    // One extra row is the sentinel that tells us a next page exists. It is
    // sliced off BEFORE anything else is derived from the page — deriving first
    // and popping later is what made every page return `limit + 1` posts.
    const feedPosts = await context.db
      .select()
      .from(feed)
      .where(
        and(
          // The Feed view itself already drops posts flagged into hiding.
          notBlockedBy(context.db, context.user?.id, feed.userId),
          // A row comparison, not the equivalent `a < x OR (a = x AND b < y)`:
          // Postgres seeks an index to a row bound but only filters on an OR, so
          // every page would re-read every newer row.
          input.cursor
            ? sql`(${feed.createdAt}, ${feed.id}) < (${input.cursor.createdAt}, ${input.cursor.postId})`
            : undefined,
          input.userId ? eq(feed.userId, input.userId) : undefined,
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

    // The cursor is the last row the client actually received, so the next
    // keyset seek (strictly-less-than) resumes immediately after it.
    const lastItem = pageItems.at(-1);
    const nextCursor =
      hasMore && lastItem ? { createdAt: lastItem.createdAt, postId: lastItem.id } : undefined;

    return {
      nextCursor,
      posts,
    };
  }),

  getPost: publicProcedure.input(getPostInput).handler(async ({ context, input }) => {
    const visible = (row: typeof post) => postVisibleTo(context.db, context.user?.id, row);

    // No `likes`/`flags` relations are loaded any more: the counters on Post
    // answer both questions, and `isLiked` is one small lookup below.
    const dbPost = await context.db.query.post.findFirst({
      where: { RAW: visible, id: input.postId },
      with: {
        // Without an ORDER BY the aggregate follows physical row order, which a
        // like can reshuffle: the counter UPDATE may move the comment's row.
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
          // The comments actually served, not `dbPost.commentCount` (which counts
          // hidden ones too) — otherwise the count would disagree with the list
          // right underneath it.
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
  getPostsByUser: publicProcedure.input(getPostsByUserInput).handler(async ({ context, input }) => {
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
