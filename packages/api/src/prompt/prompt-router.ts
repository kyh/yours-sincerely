import { createTRPCRouter, publicProcedure } from "../trpc";

export const promptRouter = createTRPCRouter({
  getRandomPrompt: publicProcedure.query(async ({ ctx }) => {
    return {
      content: "testing",
    };
    const { count, error: countError } = await ctx.supabase
      .from("Prompt")
      .select("*", { count: "exact", head: true });

    if (countError || !count) {
      throw countError;
    }

    const randomIndex = Math.floor(Math.random() * count);

    // Fetch the random row
    const dataResponse = await ctx.supabase
      .from("Prompt")
      .select("*")
      .range(randomIndex, randomIndex)
      .limit(1)
      .single();

    if (dataResponse.error) {
      throw dataResponse.error;
    }

    return dataResponse.data;
  }),
});
