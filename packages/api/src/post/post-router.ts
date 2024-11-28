import { and, desc, eq, lt, notInArray, or } from "@init/db";
import { feed, like, post } from "@init/db/schema";
import { getDefaultValues } from "@init/db/utils";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
  updatePostInput,
} from "./post-schema";

export const postRouter = createTRPCRouter({
  getFeed: publicProcedure.input(getFeedInput).query(async ({ ctx, input }) => {
    const limit = input.limit ?? 5;

    const blockedUsers = await ctx.db.query.block.findMany({
      where: (block, { eq }) => eq(block.blockerId, ctx.user?.id ?? ""),
    });
    const blockingUserIds = blockedUsers.map((user) => user.blockingId);

    const feedItems = await ctx.db
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

    let nextCursor: typeof input.cursor = undefined;
    if (feedItems.length > limit) {
      const nextItem = feedItems.pop();
      if (nextItem?.id && nextItem.createdAt) {
        nextCursor = {
          id: nextItem.id,
          createdAt: nextItem.createdAt,
        };
      }
    }

    return {
      nextCursor,
      posts: feedItems,
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
      let userId = ctx.user?.id;

      // If the user is not logged in, create an anonymous user
      if (!userId) {
        const authResponse = await ctx.supabase.auth.signInAnonymously({
          options: {
            data: {
              displayName: input.createdBy,
            },
          },
        });

        if (authResponse.error || !authResponse.data.user) {
          throw authResponse.error;
        }

        userId = authResponse.data.user.id;
      }

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

      return created;
    }),

  updatePost: protectedProcedure
    .input(updatePostInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Post")
        .update({ content: input.content })
        .eq("id", input.postId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  deletePost: protectedProcedure
    .input(deletePostInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Post")
        .delete()
        .eq("id", input.postId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
