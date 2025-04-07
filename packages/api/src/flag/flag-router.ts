import { and, eq } from "@kyh/db";
import { flag } from "@kyh/db/schema";
import { getDefaultValues } from "@kyh/db/utils";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { createFlagInput, deleteFlagInput } from "./flag-schema";

export const flagRouter = createTRPCRouter({
  createFlag: publicProcedure
    .input(createFlagInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await createUserIfNotExists(ctx);

      const [created] = await ctx.db
        .insert(flag)
        .values({
          ...getDefaultValues({ withId: false }),
          postId: input.postId,
          userId,
        })
        .returning();

      return {
        flag: created,
      };
    }),

  deleteFlag: protectedProcedure
    .input(deleteFlagInput)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(flag)
        .where(and(eq(flag.userId, ctx.user.id), eq(flag.postId, input.postId)))
        .returning();

      return {
        flag: deleted,
      };
    }),
});
