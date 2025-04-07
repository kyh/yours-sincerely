import { and, eq } from "@kyh/db";
import { like } from "@kyh/db/schema";
import { getDefaultValues } from "@kyh/db/utils";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { createLikeInput, deleteLikeInput } from "./like-schema";

export const likeRouter = createTRPCRouter({
  createLike: publicProcedure
    .input(createLikeInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await createUserIfNotExists(ctx);

      const [created] = await ctx.db
        .insert(like)
        .values({
          ...getDefaultValues({ withId: false }),
          postId: input.postId,
          userId,
        })
        .returning();

      return {
        like: created,
      };
    }),

  deleteLike: protectedProcedure
    .input(deleteLikeInput)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(like)
        .where(and(eq(like.userId, ctx.user.id), eq(like.postId, input.postId)))
        .returning();

      return {
        like: deleted,
      };
    }),
});
