import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createBlockInput,
  deleteBlockInput,
  getBlockAllInput,
  getBlockInput,
} from "./block-schema";

export const blockRouter = createTRPCRouter({
  getBlock: publicProcedure
    .input(getBlockInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Block")
        .select("*")
        .match({ blockerId: input.blockerId, blockingId: input.blockingId })
        .single();

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  getBlockAll: protectedProcedure
    .input(getBlockAllInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Block")
        .select("*")
        .match({ blockerId: input?.id });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  createBlock: publicProcedure
    .input(createBlockInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.from("Block").insert({
        ...input,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  deleteBlock: protectedProcedure
    .input(deleteBlockInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("Block")
        .delete()
        .match({ blockerId: input.blockerId, blockingId: input.blockingId });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
