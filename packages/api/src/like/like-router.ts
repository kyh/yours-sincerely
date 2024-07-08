import { defaultSelect } from "../account/account-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { allInput, byIdInput, createInput, deleteInput } from "./like-schema";

export const likeRouter = createTRPCRouter({
  all: publicProcedure.input(allInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("likes")
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
      .from("likes")
      .select("*")
      .match({ post_id: input.postId, account_id: input.userId })
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      let user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: defaultSelect,
      });
      if (!user) {
        user = await ctx.db.user.create({
          data: { displayName: "Anonymous", id: ctx.user.id },
          select: defaultSelect,
        });
      }

      const likeResponse = await ctx.supabase
        .from("likes")
        .insert({
          post_id: input.postId,
          account_id: user.id,
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
        .from("likes")
        .delete()
        .match({ post_id: input.id, account_id: ctx.user.id });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
