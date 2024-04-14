import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const accountRouter = createTRPCRouter({
  byId: publicProcedure
    .input(
      z.object({
        provider: z.string(),
        providerAccountId: z.string()
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db.account.findUnique({
        where: {
          provider_providerAccountId: input
        },
        include: {
          user: true,
        }
      })
    })
})