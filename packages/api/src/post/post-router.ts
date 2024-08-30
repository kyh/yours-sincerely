import cuid from "cuid";

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

    const blockResponse = await ctx.supabase
      .from("Block")
      .select("blockingId")
      .eq("blockerId", ctx.user?.id ?? "");

    if (blockResponse.error) {
      throw blockResponse.error;
    }

    const query = ctx.supabase
      .from("Feed")
      .select("*, likes:Like(userId)")
      .filter("userId", "not.in", `(${blockResponse.data.join(",")})`)
      .limit(limit + 1);

    if (input.userId) {
      query.eq("createdBy", input.userId);
    }

    if (input.parentId) {
      query.eq("parentId", input.parentId);
    }

    if (input.cursor) {
      query.lt("id", input.cursor);
    }

    const feedResponse = await query;

    if (feedResponse.error) {
      throw feedResponse.error;
    }

    return {
      nextCursor: feedResponse.data[feedResponse.data.length - 1]?.id,
      posts: feedResponse.data,
    };
  }),

  getPost: publicProcedure.input(getPostInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Post")
      .select("*, likes:Like(userId)")
      .eq("id", input.id)
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  createPost: publicProcedure
    .input(createPostInput)
    .mutation(async ({ ctx, input }) => {
      let userId = ctx.user?.id;

      // If the user is not logged in, create an anonymous user
      if (!userId) {
        const authResponse = await ctx.auth.signInAnonymously({
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

      const response = await ctx.supabase.from("Post").insert({
        id: cuid(),
        userId: userId,
        content: input.content,
        createdBy: input.createdBy,
        parentId: input.parentId,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  updatePost: protectedProcedure
    .input(updatePostInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Post")
        .update({ content: input.content })
        .eq("id", input.id);

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
        .eq("id", input.id);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
