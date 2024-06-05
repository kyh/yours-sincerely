import { z } from "zod";

import { defaultSelect } from "../account/account-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const likeRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.like.findMany({
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
      return ctx.db.like.findUnique({
        where: {
          postId_userId: input.postId_userId,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: defaultSelect,
      });

      if (!user) {
        user = await ctx.db.user.create({
          data: { displayName: "Anonymous", id: ctx.user.id },
          select: defaultSelect,
        });
      }

      return ctx.db.like.create({
        data: {
          post: {
            connect: {
              id: input.postId,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.like.delete({
        where: {
          postId_userId: { postId: input.id, userId: ctx.user.id },
        },
      });
    }),
});
