import { createTRPCRouter, publicProcedure } from "../trpc";

export const promptRouter = createTRPCRouter({
  random: publicProcedure.query(async ({ ctx }) => {
    const countResponse = await ctx.adminSupabase
      .from("Prompt")
      .select("*", { count: "exact", head: true });

    if (countResponse.error) {
      throw countResponse.error;
    }

    const randomIndex = Math.floor(Math.random() * (countResponse.count ?? 0));

    const dataResponse = await ctx.adminSupabase
      .from("Prompt")
      .select("*")
      .limit(1)
      .range(randomIndex, randomIndex + 1);

    if (dataResponse.error) {
      throw dataResponse.error;
    }

    return dataResponse.data[0]?.content ?? "What's on your mind?";
  }),
});
