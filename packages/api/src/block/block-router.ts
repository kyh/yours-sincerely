import { and, eq } from "@repo/db";
import { block } from "@repo/db/drizzle-schema";
import { TRPCError } from "@trpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { createBlockInput, deleteBlockInput } from "./block-schema";

export const blockRouter = createTRPCRouter({
  createBlock: publicProcedure.input(createBlockInput).mutation(async ({ ctx, input }) => {
    const userId = await createUserIfNotExists(ctx);

    // Blocking yourself would erase you from your own feed. It is never intended.
    if (input.blockingId === userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot block yourself" });
    }

    // Block_pkey is (blockerId, blockingId). Blocking the same author from a
    // second post is a no-op, not a unique-violation 500.
    const [created] = await ctx.db
      .insert(block)
      .values({
        blockerId: userId,
        blockingId: input.blockingId,
      })
      .onConflictDoNothing()
      .returning();

    // `onConflictDoNothing().returning()` yields nothing when the row already
    // existed, so read it back rather than handing the client an `undefined`.
    const existing =
      created ??
      (await ctx.db.query.block.findFirst({
        where: (row, { and, eq }) =>
          and(eq(row.blockerId, userId), eq(row.blockingId, input.blockingId)),
      }));

    return {
      block: existing,
    };
  }),

  /** The blocker's own inventory of blocks. `protectedProcedure` + a `blockerId`
      scoped to `ctx.user.id`: the actor never comes from client input. */
  listBlocks: protectedProcedure.query(async ({ ctx }) => {
    const blocks = await ctx.db.query.block.findMany({
      where: (row, { eq }) => eq(row.blockerId, ctx.user.id),
      with: {
        user_blockingId: {
          columns: { id: true, displayName: true, displayImage: true },
        },
      },
    });

    // Blocked authors are usually just "Anonymous", so the deterministic avatar
    // (derived from displayName) is the only stable identity the list can show.
    // We deliberately do NOT surface an excerpt of their letters: showing a
    // blocked author's words back to the person who blocked them is precisely
    // what they asked not to see.
    return {
      blocks: blocks.map((row) => ({
        blockingId: row.blockingId,
        displayName: row.user_blockingId.displayName,
        displayImage: row.user_blockingId.displayImage,
      })),
    };
  }),

  deleteBlock: protectedProcedure.input(deleteBlockInput).mutation(async ({ ctx, input }) => {
    // SECURITY: the `where` is scoped to ctx.user.id. Without that clause any
    // caller could delete anyone else's blocks by guessing ids — an IDOR.
    const [deleted] = await ctx.db
      .delete(block)
      .where(and(eq(block.blockerId, ctx.user.id), eq(block.blockingId, input.blockingId)))
      .returning();

    return {
      block: deleted,
    };
  }),
});
