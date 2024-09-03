import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  getUserInput,
  getUserStatsInput,
  updateUserInput,
} from "./user-schema";

export const userRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  getUser: publicProcedure.input(getUserInput).query(async ({ ctx, input }) => {
    const response = await ctx.supabase
      .from("User")
      .select("*")
      .eq("id", input.userId)
      .single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }),

  updateUser: protectedProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("User")
        .update({
          email: input.email,
          displayImage: input.displayImage,
          displayName: input.displayName,
          weeklyDigestEmail: input.weeklyDigestEmail,
        })
        .eq("id", input.userId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  getUserStats: publicProcedure
    .input(getUserStatsInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("UserStats")
        .select("*")
        .eq("userId", input.userId)
        .single();

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
