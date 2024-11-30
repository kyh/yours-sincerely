import { and, desc, eq, lt, notInArray, or } from "@init/db";
import { feed, post } from "@init/db/schema";
import { getDefaultValues } from "@init/db/utils";

import { getUserId } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
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
                  lt(feed.id, input.cursor.id),
                ),
              )
            : undefined,
          input.userId ? eq(feed.userId, input.userId) : undefined,
          input.parentId ? eq(feed.parentId, input.parentId) : undefined,
        ),
      )
      .orderBy(desc(feed.createdAt), desc(feed.id))
      .limit(limit + 1);

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

    const posts = feedPosts.map((post) => ({
      ...post,
      isLiked: !!feedItemLikes.find((like) => like.postId === post.id),
    }));

    let nextCursor: typeof input.cursor = undefined;
    if (feedPosts.length > limit) {
      const nextItem = feedPosts.pop();
      if (nextItem?.id && nextItem.createdAt) {
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }
    }

    return {
      nextCursor,
      posts,
    };
  }),

  getPost: publicProcedure.input(getPostInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Post")
      .select("*, likes:Like(userId)")
      .eq("id", input.postId)
      .single();

    if (response.error) {
      throw response.error;
    }

    return {
      ...response.data,
      likeCount: response.data.likes.length,
      commentCount: 0,
    };
  }),

  createPost: publicProcedure
    .input(createPostInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getUserId(ctx, input.createdBy);

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
