import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const eventRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.enrolledEvent.findMany({
        where: {
          userId: input.id,
        },
        orderBy: {
          start: "desc",
        },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.enrolledEvent.findUnique({
        where: input,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        slug: z.string(),
        start: z.date().optional(),
        end: z.date(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.enrolledEvent.create({
        data: { ...input, userId: ctx.user.id },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.enrolledEvent.delete({
        where: input,
      });
    }),
});
