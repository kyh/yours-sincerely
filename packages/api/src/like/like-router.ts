import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createLikeInput,
  deleteLikeInput,
  getLikeAllInput,
  getLikeInput,
} from "./like-schema";

export const likeRouter = createTRPCRouter({
  getLike: publicProcedure.input(getLikeInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Like")
      .select("*")
      .match({ postId: input.postId, userId: input.userId })
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  all: publicProcedure.input(getLikeAllInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Like")
      .select("*")
      .eq("userId", input.id)
      .order("createdAt", { ascending: false });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  createLike: protectedProcedure
    .input(createLikeInput)
    .mutation(async ({ ctx, input }) => {
      const likeResponse = await ctx.supabase
        .from("Like")
        .insert({
          postId: input.postId,
          userId: ctx.user.id,
        })
        .select("*");

      if (likeResponse.error) {
        throw likeResponse.error;
      }

      return likeResponse.data;
    }),

  deleteLike: protectedProcedure
    .input(deleteLikeInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Like")
        .delete()
        .match({ postId: input.id, userId: ctx.user.id });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
