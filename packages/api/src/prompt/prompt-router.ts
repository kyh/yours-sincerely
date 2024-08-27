import { createTRPCRouter, publicProcedure } from "../trpc";

export const promptRouter = createTRPCRouter({
  getRandomPrompt: publicProcedure.query(async ({ ctx }) => {
    const dataResponse = await ctx.supabase.rpc("getRandomPrompt");

    if (dataResponse.error) {
      throw dataResponse.error;
    }

    return dataResponse.data;
  }),
});
