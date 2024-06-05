import { createTRPCRouter, publicProcedure } from "../trpc";

const randomPick = (array: string[]) =>
  array[Math.floor(Math.random() * array.length)];

export const promptRouter = createTRPCRouter({
  random: publicProcedure.query(async ({ ctx }) => {
    const itemCount = await ctx.db.prompt.count();
    const skip = Math.max(0, Math.floor(Math.random() * itemCount) - 1);
    const orderBy = randomPick(["id", "content"]);
    const orderDir = randomPick(["asc", "desc"]);

    const prompts = await ctx.db.prompt.findMany({
      take: 1,
      skip: skip,
      orderBy: { [orderBy ?? "id"]: orderDir ?? "asc" },
    });

    return prompts[0]?.content ?? "What's on your mind?";
  }),
});
