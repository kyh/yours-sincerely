import type { TRPCContext } from "../trpc";
import { and, desc, eq, inArray, lt, notExists, or, sql } from "@repo/db";
import { block, feed, flag, like, post } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { getKnockClient } from "../knock";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
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
const findMyLikes = async (ctx: TRPCContext, postIds: string[]): Promise<Set<string>> => {
  const viewerId = ctx.user?.id;
  if (!viewerId || postIds.length === 0) return new Set();

  const rows = await ctx.db.query.like.findMany({
    where: (row, { and, eq, inArray }) =>
      and(eq(row.userId, viewerId), inArray(row.postId, postIds)),
    columns: { postId: true },
  });

  return new Set(rows.map((row) => row.postId));
};

export const postRouter = createTRPCRouter({
  getFeed: publicProcedure.input(getFeedInput).query(async ({ ctx, input }) => {
    const limit = input.limit ?? 5;
    const viewerId = ctx.user?.id;

    // Blocked authors are excluded inside the query as a correlated NOT EXISTS,
    // rather than fetching the viewer's whole block list on a separate round-trip
    // and passing it back down as a literal array.
    const notBlocked = viewerId
      ? notExists(
          ctx.db
            .select({ blocked: sql`1` })
            .from(block)
            .where(and(eq(block.blockerId, viewerId), eq(block.blockingId, feed.userId))),
        )
      : undefined;

    // One extra row is the sentinel that tells us a next page exists. It is
    // sliced off BEFORE anything else is derived from the page — deriving first
    // and popping later is what made every page return `limit + 1` posts.
    const feedPosts = await ctx.db
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
      ctx,
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
  getPostsByUser: publicProcedure.input(getPostsByUserInput).query(async ({ ctx, input }) => {
    const posts = await ctx.db.query.post.findMany({
      where: (post, { and, eq, gte }) =>
        and(eq(post.userId, input.userId), gte(post.createdAt, getPostHistoryFloor())),
      orderBy: (post, { desc }) => desc(post.createdAt),
      columns: {
        createdAt: true,
      },
    });

    return { posts };
  }),

  getPost: publicProcedure.input(getPostInput).query(async ({ ctx, input }) => {
    const blockedUsers = await ctx.db.query.block.findMany({
      where: (block, { eq }) => eq(block.blockerId, ctx.user?.id ?? ""),
    });
    const blockingUserIds = new Set(blockedUsers.map((user) => user.blockingId));

    // No `likes`/`flags` relations are loaded any more: the counters on Post
    // answer both questions, and `isLiked` is one small lookup below.
    const dbPost = await ctx.db.query.post.findFirst({
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    const comments = dbPost.posts.filter((comment) => !isHidden(comment));
    const myLikes = await findMyLikes(ctx, [dbPost.id, ...comments.map((row) => row.id)]);

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

  createPost: publicProcedure.input(createPostInput).mutation(async ({ ctx, input }) => {
    const userId = await createUserIfNotExists(ctx, input.createdBy);

    const [created] = await ctx.db
      .insert(post)
      .values({
        ...getDefaultValues(),
        userId: userId,
        content: input.content,
        createdBy: input.createdBy || "Anonymous",
        parentId: input.parentId,
      })
      .returning();

    const knock = getKnockClient();
    if (created?.parentId && knock !== null) {
      const parentPost = await ctx.db.query.post.findFirst({
        where: (post, { eq }) => eq(post.id, created.parentId ?? ""),
        with: {
          user: true,
        },
      });
      const recipient = parentPost?.user;

      if (recipient) {
        await knock.workflows.trigger("new-comment", {
          data: {
            parentPostId: parentPost.id,
            commentPostId: created.id,
          },
          actor: {
            id: created.userId,
            displayName: created.createdBy,
          },
          recipients: [
            {
              id: recipient.id,
              displayName: recipient.displayName,
            },
          ],
        });
      }
    }

    return {
      post: created,
    };
  }),

  deletePost: protectedProcedure.input(deletePostInput).mutation(async ({ ctx, input }) => {
    const ownedPost = await ctx.db.query.post.findFirst({
      where: (post, { and, eq }) => and(eq(post.id, input.postId), eq(post.userId, ctx.user.id)),
      columns: { id: true },
    });

    if (ownedPost === undefined) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
    }

    const deleted = await ctx.db.transaction(async (tx) => {
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
});
