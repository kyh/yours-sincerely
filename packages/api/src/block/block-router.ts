import { and, eq } from "@repo/db";
import { block } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { protectedProcedure, publicProcedure } from "../orpc";
import { createBlockInput, deleteBlockInput } from "./block-schema";

export const blockRouter = {
  createBlock: publicProcedure.input(createBlockInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    // Blocking yourself would erase you from your own feed. It is never intended.
    if (input.blockingId === userId) {
      throw new ORPCError("BAD_REQUEST", { message: "You cannot block yourself" });
    }

    // Block_pkey is (blockerId, blockingId). Blocking the same author from a
    // second post is a no-op, not a unique-violation 500.
    const [created] = await context.db
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
      (await context.db.query.block.findFirst({
        where: (row, { and, eq }) =>
          and(eq(row.blockerId, userId), eq(row.blockingId, input.blockingId)),
      }));

    return {
      block: existing,
    };
  }),

  /** The blocker's own inventory of blocks. `protectedProcedure` + a `blockerId`
      scoped to `context.user.id`: the actor never comes from client input. */
  listBlocks: protectedProcedure.handler(async ({ context }) => {
    const blocks = await context.db.query.block.findMany({
      where: (row, { eq }) => eq(row.blockerId, context.user.id),
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

  deleteBlock: protectedProcedure.input(deleteBlockInput).handler(async ({ context, input }) => {
    // SECURITY: the `where` is scoped to context.user.id. Without that clause any
    // caller could delete anyone else's blocks by guessing ids — an IDOR.
    const [deleted] = await context.db
      .delete(block)
      .where(and(eq(block.blockerId, context.user.id), eq(block.blockingId, input.blockingId)))
      .returning();

    return {
      block: deleted,
    };
  }),
};
