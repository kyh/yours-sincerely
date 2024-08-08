import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { updatePictureInput } from "./personal-account-schema";

export const accountRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  updatePicture: protectedProcedure
    .input(updatePictureInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("User")
        .update({
          displayImage: input.displayImage,
        })
        .eq("id", input.accountId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
});
