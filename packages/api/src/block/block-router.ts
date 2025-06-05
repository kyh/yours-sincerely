import { and, eq } from "@repo/db";
import { block } from "@repo/db/schema";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { createBlockInput, deleteBlockInput } from "./block-schema";

export const blockRouter = createTRPCRouter({
  createBlock: publicProcedure
    .input(createBlockInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await createUserIfNotExists(ctx);

      const [created] = await ctx.db
        .insert(block)
        .values({
          blockerId: userId,
          blockingId: input.blockingId,
        })
        .returning();

      return {
        block: created,
      };
    }),

  deleteBlock: protectedProcedure
    .input(deleteBlockInput)
    .query(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(block)
        .where(
          and(
            eq(block.blockerId, ctx.user.id),
            eq(block.blockingId, input.blockingId),
          ),
        )
        .returning();

      return {
        block: deleted,
      };
    }),
});
