import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { byIdInput, updateInput } from "./personal-account-schema";

export const accountRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  byId: protectedProcedure.input(byIdInput).query(async ({ ctx, input }) => {
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

  update: protectedProcedure
    .input(updateInput)
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
