import { createTRPCRouter, publicProcedure } from "../trpc";

export const promptRouter = createTRPCRouter({
  random: publicProcedure.query(async ({ ctx }) => {
    // const dataResponse = await ctx.adminSupabase
    //   .from("Prompt")
    //   .select("*")
    //   .order("random()")
    //   .single();

    // if (dataResponse.error) {
    //   throw dataResponse.error;
    // }

    // return dataResponse.data.content ?? "What's on your mind?";
    return "What's on your mind?";
  }),
});
