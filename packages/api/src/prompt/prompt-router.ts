import { createTRPCRouter, publicProcedure } from "../trpc";

export const promptRouter = createTRPCRouter({
  random: publicProcedure.query(async ({ ctx }) => {
    const dataResponse = await ctx.adminSupabase.rpc("getRandomPrompt");

    if (dataResponse.error) {
      throw dataResponse.error;
    }

    return dataResponse.data;
  }),
});
