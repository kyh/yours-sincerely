import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { allInput, byIdInput, createInput, deleteInput } from "./flag-schema";

export const flagRouter = createTRPCRouter({
  all: publicProcedure.input(allInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("flags")
      .select("*")
      .eq("account_id", input.id)
      .order("created_at", { ascending: false });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  byId: publicProcedure.input(byIdInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("flags")
      .select("*")
      .match({ post_id: input.postId, account_id: input.userId })
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  create: publicProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.from("flags").insert({
        comment: input.comment,
        resolved: input.resolved,
        post_id: input.postId,
        account_id: input.userId,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  delete: publicProcedure
    .input(deleteInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("flags")
        .delete()
        .match({ post_id: input.postId, account_id: input.userId });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
