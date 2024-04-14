import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

const randomPick = (array: string[]) =>
  array[Math.floor(Math.random() * array.length)];

export const promptRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ count: z.number() }))
    .query(async ({ ctx, input }) => {
      const itemCount = await ctx.db.prompt.count();
      const skip = Math.max(0, Math.floor(Math.random() * itemCount) - input.count);
      const orderBy = randomPick(["id", "content"])!;
      const orderDir = randomPick(["asc", "desc"])!;

      return ctx.db.prompt.findMany({
        take: input.count,
        skip: skip,
        orderBy: { [orderBy]: orderDir },
      });
    }),
});