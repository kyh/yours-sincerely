import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const flagRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.flag.findMany({
        where: {
          userId: input.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  byId: publicProcedure
    .input(
      z.object({
        postId_userId: z.object({
          postId: z.string(),
          userId: z.string(),
        }),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.flag.findUnique({
        where: {
          postId_userId: input.postId_userId,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        comment: z.string().optional(),
        resolved: z.boolean().optional(),
        postId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.flag.create({
        data: input,
      });
    }),

  delete: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.flag.delete({
        where: {
          postId_userId: input,
        },
      });
    }),
});
