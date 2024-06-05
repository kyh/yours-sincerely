import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const blockRouter = createTRPCRouter({
  all: protectedProcedure
    .input(z.object({ id: z.string() }).optional())
    .query(({ ctx, input }) => {
      return ctx.db.block.findMany({
        where: {
          blockerId: input?.id,
        },
      });
    }),

  byId: publicProcedure
    .input(
      z.object({
        blockerId: z.string(),
        blockingId: z.string(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.block.findUnique({
        where: {
          blockerId_blockingId: input,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        blocker: z.object({
          connect: z.object({
            id: z.string(),
          }),
        }),
        blocking: z.object({
          connect: z.object({
            id: z.string(),
          }),
        }),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.block.create({
        data: input,
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        blockerId: z.string(),
        blockingId: z.string(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.block.delete({
        where: {
          blockerId_blockingId: input,
        },
      });
    }),
});
