import { Knock } from "@knocklabs/node";
import { and, desc, eq, lt, notInArray, or } from "@repo/db";
import { feed, post } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  convertDbPostToFeedPost,
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
  getPostsByUserInput,
} from "./post-schema";

export const postRouter = createTRPCRouter({
  getFeed: publicProcedure.input(getFeedInput).query(async ({ ctx, input }) => {
    const limit = input.limit ?? 5;

    const blockedUsers = await ctx.db.query.block.findMany({
      where: (block, { eq }) => eq(block.blockerId, ctx.user?.id ?? ""),
    });
    const blockingUserIds = blockedUsers.map((user) => user.blockingId);

    const feedPosts = await ctx.db
      .select()
      .from(feed)
      .where(
        and(
          notInArray(feed.userId, blockingUserIds),
          input.cursor
            ? or(
                lt(feed.createdAt, input.cursor.createdAt),
                and(
                  eq(feed.createdAt, input.cursor.createdAt),
                  lt(feed.id, input.cursor.postId),
                ),
              )
            : undefined,
          input.userId ? eq(feed.userId, input.userId) : undefined,
          input.parentId ? eq(feed.parentId, input.parentId) : undefined,
        ),
      )
      .orderBy(desc(feed.createdAt), desc(feed.id))
      .limit(limit + 1);

    const myLikes = new Set<string>();
    if (ctx.user?.id) {
      const feedItemLikes = await ctx.db.query.like.findMany({
        where: (like, { eq, and, inArray }) =>
          and(
            ctx.user?.id ? eq(like.userId, ctx.user.id) : undefined,
            inArray(
              like.postId,
              feedPosts.map((item) => item.id),
            ),
          ),
      });
      feedItemLikes.forEach((like) => myLikes.add(like.postId));
    }

    const posts = feedPosts.map((post) => ({
      ...post,
      isLiked: myLikes.has(post.id),
    }));

    let nextCursor: typeof input.cursor = undefined;
    if (feedPosts.length > limit) {
      const nextItem = feedPosts.pop();
      if (nextItem?.id && nextItem.createdAt) {
        nextCursor = {
          postId: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }
    }

    return {
      nextCursor,
      posts,
    };
  }),

  getPostsByUser: publicProcedure
    .input(getPostsByUserInput)
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db.query.post.findMany({
        where: (post, { eq }) => eq(post.userId, input.userId),
        orderBy: (post, { desc }) => desc(post.createdAt),
      });

      return { posts };
    }),

  getPost: publicProcedure.input(getPostInput).query(async ({ ctx, input }) => {
    const dbPost = await ctx.db.query.post.findFirst({
      where: (post, { eq }) => eq(post.id, input.postId),
      with: {
        likes: true,
        posts: true,
      },
    });

    if (!dbPost) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    return {
      post: convertDbPostToFeedPost(dbPost, ctx.user?.id),
    };
  }),

  createPost: publicProcedure
    .input(createPostInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await createUserIfNotExists(ctx, input.createdBy);

      const [created] = await ctx.db
        .insert(post)
        .values({
          ...getDefaultValues(),
          userId: userId,
          content: input.content,
          createdBy: input.createdBy || "Anonymous",
          parentId: input.parentId,
          baseLikeCount: input.baseLikeCount,
        })
        .returning();

      if (created?.parentId) {
        const knock = new Knock();
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

  deletePost: protectedProcedure
    .input(deletePostInput)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(post)
        .where(eq(post.id, input.postId))
        .returning();

      return {
        post: deleted,
      };
    }),
});
