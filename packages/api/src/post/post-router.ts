import cuid from "cuid";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
  updatePostInput,
} from "./post-schema";
import { POST_EXPIRY_DAYS_AGO } from "./post-utils";

export const postRouter = createTRPCRouter({
  getFeed: publicProcedure.input(getFeedInput).query(async ({ ctx, input }) => {
    const limit = input.limit ?? 5;

    const blockResponse = await ctx.supabase
      .from("Block")
      .select("blockingId")
      .eq("blockerId", input.userId ?? "");

    if (blockResponse.error) {
      throw blockResponse.error;
    }

    const query = ctx.supabase
      .from("Feed")
      .select(
        `
        *,
        likes:Like(userId)
      `,
      )
      .filter("userId", "not.in", `(${blockResponse.data.join(",")})`)
      .gte(
        "createdAt",
        new Date(
          Date.now() - POST_EXPIRY_DAYS_AGO * 24 * 60 * 60 * 1000,
        ).toISOString(),
      )
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
      .from("Feed")
      .select(
        `
        *,
        likes:Like(userId)
      `,
      )
      .eq("id", input.id)
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  createPost: protectedProcedure
    .input(createPostInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.from("Post").insert({
        id: cuid(),
        userId: ctx.user.id,
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
