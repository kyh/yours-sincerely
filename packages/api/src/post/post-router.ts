import cuid from "cuid";
import { addDays, formatISO } from "date-fns";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPostInput,
  deletePostInput,
  getPostAllInput,
  getPostInput,
  getPostListInput,
  updatePostInput,
} from "./post-schema";
import { formatPost, POST_EXPIRY_DAYS_AGO } from "./post-utils";

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

    return formatPost(response.data);
  }),

  getPostList: publicProcedure
    .input(getPostListInput)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 5;

      let blocks: string[] = [];
      if (ctx.user) {
        const blocksResponse = await ctx.supabase
          .from("Block")
          .select("blockingId")
          .eq("blockerId", ctx.user.id);
        if (blocksResponse.error) {
          throw blocksResponse.error;
        }
        blocks = blocksResponse.data.map(({ blockingId }) => blockingId);
      }

      let query = ctx.adminSupabase
        .from("Post")
        .select("*, comments:Post(*), flags:Flag(*), likes:Like(*)");

      if (input.cursor) {
        query = query.lt("id", input.cursor);
      }
      if (input.parentId) {
        query = query.eq("parentId", input.parentId);
      } else {
        query = query
          .is("parentId", null)
          .gte(
            "createdAt",
            formatISO(addDays(new Date(), -POST_EXPIRY_DAYS_AGO)),
          );
      }
      if (blocks.length) {
        query = query.not("userId", "in", `(${blocks.join(",")})`);
      }

      const postResponse = await query
        .limit(limit + 1)
        .order("createdAt", { ascending: false });

      if (postResponse.error) {
        throw postResponse.error;
      }

      const posts = postResponse.data;

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        nextCursor = posts[posts.length - 1]?.id;
      }

      return {
        nextCursor,
        posts: posts.map(formatPost),
      };
    }),

  getPostAll: publicProcedure
    .input(getPostAllInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.adminSupabase
        .from("Post")
        .select("*, comments:Post(*), flags:Flag(*), likes:Like(*)")
        .eq("userId", input.userId)
        .is("parentId", null);

      if (response.error) {
        throw response.error;
      }

      return response.data.map(formatPost);
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

        userId = cuid();
        await ctx.supabase.from("User").insert({
          id: userId,
          primaryOwnerUserId: authResponse.data.user.id,
        });
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
