import type { ORPCContext } from "../orpc";
import { and, desc, eq, inArray, lt, notExists, or, sql } from "@repo/db";
import { block, feed, flag, like, notification, post } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import {
  describeNotification,
  type NewCommentNotificationData,
} from "@repo/contracts/notifications";
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
  if (!viewerId || postIds.length === 0) return new Set();

  const rows = await context.db.query.like.findMany({
    where: (row, { and, eq, inArray }) =>
      and(eq(row.userId, viewerId), inArray(row.postId, postIds)),
    columns: { postId: true },
  });

  return new Set(rows.map((row) => row.postId));
};

export const postRouter = {
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

    const posts = pageItems.map((post) => ({
      ...post,
      isLiked: myLikes.has(post.id),
    }));

    // The cursor is the last row the client actually received, so the next
    // keyset seek (strictly-less-than) resumes immediately after it.
    const lastItem = pageItems.at(-1);
    const nextCursor =
      hasMore && lastItem ? { postId: lastItem.id, createdAt: lastItem.createdAt } : undefined;

    return {
      nextCursor,
      posts,
    };
  }),

  /** Feeds the profile heatmap and the day-of-week histogram, both of which need
      only dates. It is public and takes an arbitrary `userId`, so it must not
      hand out post IDs: that turned any author into an enumerable archive of
      every letter they ever wrote, permalink by permalink. Dates only. */
  getPostsByUser: publicProcedure.input(getPostsByUserInput).handler(async ({ context, input }) => {
    const posts = await context.db.query.post.findMany({
      where: (post, { and, eq, gte }) =>
        and(eq(post.userId, input.userId), gte(post.createdAt, getPostHistoryFloor())),
      orderBy: (post, { desc }) => desc(post.createdAt),
      columns: {
        createdAt: true,
      },
    });

    return { posts };
  }),

  getPost: publicProcedure.input(getPostInput).handler(async ({ context, input }) => {
    const blockedUsers = await context.db.query.block.findMany({
      where: (block, { eq }) => eq(block.blockerId, context.user?.id ?? ""),
    });
    const blockingUserIds = new Set(blockedUsers.map((user) => user.blockingId));

    // No `likes`/`flags` relations are loaded any more: the counters on Post
    // answer both questions, and `isLiked` is one small lookup below.
    const dbPost = await context.db.query.post.findFirst({
      where: (post, { eq }) => eq(post.id, input.postId),
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
          isLiked: myLikes.has(dbPost.id),
          // The comments actually served, not `dbPost.commentCount` (which counts
          // hidden ones too) — otherwise the count would disagree with the list
          // right underneath it. Unchanged from the previous behaviour.
          commentCount: comments.length,
        }),
        comments: comments.map((comment) =>
          convertDbPostToFeedPost(comment, {
            isLiked: myLikes.has(comment.id),
            commentCount: 0,
          }),
        ),
      },
    };
  }),

  createPost: publicProcedure.input(createPostInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context, input.createdBy);

    // The comment and its notification commit together: a letter author is
    // never told about a reply that failed to save, and never misses one that did.
    const { created, reply } = await context.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(post)
        .values({
          ...getDefaultValues(),
          userId: userId,
          content: input.content,
          createdBy: input.createdBy || "Anonymous",
          parentId: input.parentId,
        })
        .returning();

      const parent = created?.parentId
        ? await tx.query.post.findFirst({
            where: (post, { eq }) => eq(post.id, created.parentId ?? ""),
            columns: { id: true, userId: true },
          })
        : undefined;

      if (!created || !parent || parent.userId === created.userId) {
        return { created, reply: null };
      }

      // A blocked commenter's words must never reach the person who blocked
      // them: `getPost` hides the reply, so the row would point at nothing and
      // the push would be the one channel the block did not cover.
      const blocked = await tx.query.block.findFirst({
        where: (block, { and, eq }) =>
          and(eq(block.blockerId, parent.userId), eq(block.blockingId, created.userId)),
        columns: { blockerId: true },
      });
      if (blocked) return { created, reply: null };

      const actorName = created.createdBy ?? "Anonymous";

      await tx
        .insert(notification)
        .values({
          ...getDefaultValues({ withUpdatedAt: false }),
          userId: parent.userId,
          kind: "COMMENT",
          postId: parent.id,
          commentId: created.id,
          actorName,
        })
        .onConflictDoNothing({ target: [notification.userId, notification.commentId] });

      return {
        created,
        reply: {
          recipientId: parent.userId,
          parentPostId: parent.id,
          commentPostId: created.id,
          actorName,
        },
      };
    });

    // After commit, best-effort, and off the response path: the comment is
    // saved, so a push Expo is slow to accept must neither fail it nor hold the
    // reply open until the client times out and posts the same comment twice.
    if (reply) {
      await afterResponse(async () => {
        await sendPushToUser({
          userId: reply.recipientId,
          title: "Yours Sincerely",
          body: describeNotification({ kind: "COMMENT", actorName: reply.actorName }),
          data: {
            parentPostId: reply.parentPostId,
            commentPostId: reply.commentPostId,
          } satisfies NewCommentNotificationData,
        });
      });
    }

    return {
      post: created,
    };
  }),

  deletePost: protectedProcedure.input(deletePostInput).handler(async ({ context, input }) => {
    const ownedPost = await context.db.query.post.findFirst({
      where: (post, { and, eq }) =>
        and(eq(post.id, input.postId), eq(post.userId, context.user.id)),
      columns: { id: true },
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
};
