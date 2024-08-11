import { createTRPCRouter, publicProcedure } from "../trpc";
import { allInput, byIdInput, createInput, deleteInput } from "./flag-schema";

export const flagRouter = createTRPCRouter({
  all: publicProcedure.input(allInput).query(async ({ ctx, input }) => {
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

  byId: publicProcedure.input(byIdInput).query(async ({ ctx, input }) => {
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

  create: publicProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.from("Flag").insert({
        ...input,
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
        .from("Flag")
        .delete()
        .match({ postId: input.postId, userId: input.userId });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
