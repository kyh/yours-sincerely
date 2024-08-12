import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getUserInput, updateUserInput } from "./user-schema";

export const userRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  getUser: protectedProcedure
    .input(getUserInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("User")
        .select("*")
        .eq("id", input.id)
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
        .eq("id", input.id);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
