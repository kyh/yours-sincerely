import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { allInput, byIdInput, createInput, deleteInput } from "./block-schema";

export const blockRouter = createTRPCRouter({
  all: protectedProcedure.input(allInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("Block")
      .select("*")
      .match({ blockerId: input?.id });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  byId: publicProcedure.input(byIdInput).query(async ({ ctx, input }) => {
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

  create: publicProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.from("Block").insert({
        ...input,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  delete: protectedProcedure
    .input(deleteInput)
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
