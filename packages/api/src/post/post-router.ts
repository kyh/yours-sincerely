import cuid from "cuid";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostAllInput,
  getPostInput,
  updatePostInput,
} from "./post-schema";
import { POST_EXPIRY_DAYS_AGO } from "./post-utils";

export const postRouter = createTRPCRouter({
  getPost: publicProcedure.input(getPostInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Post")
      .select("*, comments:Post(*), flags:Flag(*), likes:Like(*)")
      .eq("id", input.id)
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

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
      .select("*")
      .filter("author_id", "not.in", `(${blockResponse.data.join(",")})`)
      .limit(limit + 1);

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

  getPostAll: publicProcedure
    .input(getPostAllInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Post")
        .select("*, comments:Post(*), flags:Flag(*), likes:Like(*)")
        .eq("userId", input.userId)
        .is("parentId", null);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  createPost: publicProcedure
    .input(createPostInput)
    .mutation(async ({ ctx, input }) => {
      let userId = ctx.user?.id;

      if (!userId) {
        const authResponse = await ctx.supabase.auth.signInAnonymously();
        if (authResponse.error ?? !authResponse.data.user) {
          throw authResponse.error;
        }
        userId = authResponse.data.user.id;
      }

      const response = await ctx.supabase.from("Post").insert({
        id: cuid(),
        userId,
        content: input.content,
        createdBy: input.createdBy,
        parentId: input.parentId,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  updatePost: publicProcedure
    .input(updatePostInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Post")
        .update({
          parentId: input.parentId,
          content: input.content,
          userId: input.userId,
        })
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
