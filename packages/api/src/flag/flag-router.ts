import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  createFlagInput,
  deleteFlagInput,
  getFlagAllInput,
  getFlagInput,
} from "./flag-schema";

export const flagRouter = createTRPCRouter({
  getFlag: publicProcedure.input(getFlagInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Flag")
      .select("*")
      .match({ postId: input.postId, userId: input.userId })
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  getFlagAll: publicProcedure
    .input(getFlagAllInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Flag")
        .select("*")
        .eq("userId", input.id)
        .order("createdAt", { ascending: false });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  createFlag: publicProcedure
    .input(createFlagInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.from("Flag").insert({
        ...input,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  deleteFlag: publicProcedure
    .input(deleteFlagInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Flag")
        .delete()
        .match({ postId: input.postId, userId: input.userId });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
