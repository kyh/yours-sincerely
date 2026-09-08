import type { ORPCContext } from "../orpc";
import { and, desc, eq, gte, inArray, lt, notExists, or, sql } from "@repo/db";
import { block, feed, flag, like, notification, post } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { describeNotification } from "@repo/contracts/notifications";
import type { NewCommentNotificationData } from "@repo/contracts/notifications";
import { ORPCError } from "@orpc/server";

import { afterResponse } from "../after-response";
import { createUserIfNotExists } from "../auth/auth-utils";
import { protectedProcedure, publicProcedure } from "../orpc";
import { sendPushToUser } from "../push/expo-push";
import {
  convertDbPostToFeedPost,
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
  getPostsByUserInput,
} from "./post-schema";
import { collectDescendantPostIds, getPostHistoryFloor, isFlaggedIntoHiding } from "./post-utils";

/** Which of these posts the viewer has liked. One indexed lookup over the ids on
    the page, instead of loading every `Like` row of every post to find out. */
const findMyLikes = async (context: ORPCContext, postIds: string[]): Promise<Set<string>> => {
  const viewerId = context.user?.id;
  if (!viewerId || postIds.length === 0) {
    return new Set();
  }

  const rows = await context.db.query.like.findMany({
    columns: { postId: true },
    where: and(eq(like.userId, viewerId), inArray(like.postId, postIds)),
  });

  return new Set(rows.map((row) => row.postId));
};

export const postRouter = {
  createPost: publicProcedure.input(createPostInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context, input.createdBy);

    // The comment and its notification commit together: a letter author is
    // never told about a reply that failed to save, and never misses one that did.
    const { created, reply } = await context.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(post)
        .values({
          ...getDefaultValues(),
          content: input.content,
          createdBy: input.createdBy || "Anonymous",
          parentId: input.parentId,
          userId,
        })
        .returning();

      const parent = inserted?.parentId
        ? await tx.query.post.findFirst({
            columns: { id: true, userId: true },
            where: eq(post.id, inserted.parentId ?? ""),
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
        where: and(eq(block.blockerId, parent.userId), eq(block.blockingId, inserted.userId)),
      });
      if (blocked) {
        return { created: inserted, reply: null };
      }

      const actorName = inserted.createdBy ?? "Anonymous";

      await tx
        .insert(notification)
        .values({
          ...getDefaultValues({ withUpdatedAt: false }),
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
          title: "Yours Sincerely",
          userId: reply.recipientId,
        });
      });
    }

    return {
      post: created,
    };
  }),

  deletePost: protectedProcedure.input(deletePostInput).handler(async ({ context, input }) => {
    const ownedPost = await context.db.query.post.findFirst({
      columns: { id: true },
      where: and(eq(post.id, input.postId), eq(post.userId, context.user.id)),
    });

    if (ownedPost === undefined) {
      throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    }

    const deleted = await context.db.transaction(async (tx) => {
      const postIds = await collectDescendantPostIds(tx, [input.postId]);

      await tx.delete(like).where(inArray(like.postId, postIds));
      await tx.delete(flag).where(inArray(flag.postId, postIds));
      // One statement so the self-referential Post.parentId FK is checked
      // after parents and children are gone together.
      const deletedPosts = await tx.delete(post).where(inArray(post.id, postIds)).returning();

      return deletedPosts.find((row) => row.id === input.postId);
    });

    return {
      post: deleted,
    };
  }),

  getFeed: publicProcedure.input(getFeedInput).handler(async ({ context, input }) => {
    const limit = input.limit ?? 5;
    const viewerId = context.user?.id;

    // Blocked authors are excluded inside the query as a correlated NOT EXISTS,
    // rather than fetching the viewer's whole block list on a separate round-trip
    // and passing it back down as a literal array.
    const notBlocked = viewerId
      ? notExists(
          context.db
            .select({ blocked: sql`1` })
            .from(block)
            .where(and(eq(block.blockerId, viewerId), eq(block.blockingId, feed.userId))),
        )
      : undefined;

    // One extra row is the sentinel that tells us a next page exists. It is
    // sliced off BEFORE anything else is derived from the page — deriving first
    // and popping later is what made every page return `limit + 1` posts.
    const feedPosts = await context.db
      .select()
      .from(feed)
      .where(
        and(
          notBlocked,
          input.cursor
            ? or(
                lt(feed.createdAt, input.cursor.createdAt),
                and(eq(feed.createdAt, input.cursor.createdAt), lt(feed.id, input.cursor.postId)),
              )
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
    const blockedUsers = await context.db.query.block.findMany({
      where: eq(block.blockerId, context.user?.id ?? ""),
    });
    const blockingUserIds = new Set(blockedUsers.map((user) => user.blockingId));

    // No `likes`/`flags` relations are loaded any more: the counters on Post
    // answer both questions, and `isLiked` is one small lookup below.
    const dbPost = await context.db.query.post.findFirst({
      where: eq(post.id, input.postId),
      with: { posts: true },
    });

    // Mirror the Feed view's moderation rules: hide content from blocked users,
    // and posts the community has flagged into hiding. `flagCount` counts ONLY
    // flags the database judged to carry moderation authority — the very column
    // the Feed view filters on. A raw count of Flag rows here would hand any
    // cookieless caller a four-request censorship primitive.
    //
    // Expiry is deliberately NOT part of this: a letter leaves the feed after 21
    // days but stays readable at its permalink. Share links do not die.
    const isHidden = (item: { userId: string; flagCount: number }) =>
      blockingUserIds.has(item.userId) || isFlaggedIntoHiding(item.flagCount);

    if (!dbPost || isHidden(dbPost)) {
      throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    }

    const comments = dbPost.posts.filter((comment) => !isHidden(comment));
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
      orderBy: desc(post.createdAt),
      where: and(eq(post.userId, input.userId), gte(post.createdAt, getPostHistoryFloor())),
    });

    return { posts };
  }),
};
