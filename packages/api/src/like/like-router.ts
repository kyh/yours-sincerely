import { getCreateColumnValues } from "@init/db/column-values";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { allInput, byIdInput, createInput, deleteInput } from "./like-schema";

export const likeRouter = createTRPCRouter({
  all: publicProcedure.input(allInput).query(async ({ ctx, input }) => {
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

  byId: publicProcedure.input(byIdInput).query(async ({ ctx, input }) => {
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

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const likeResponse = await ctx.supabase
        .from("Like")
        .insert({
          ...getCreateColumnValues(),
          postId: input.postId,
          userId: ctx.user.id,
        })
        .select("*, account (id)");

      if (likeResponse.error) {
        throw likeResponse.error;
      }

      return likeResponse.data;
    }),

  delete: protectedProcedure
    .input(deleteInput)
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
