import { and, eq } from "@repo/db";
import { block } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { os, requireUser } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";

const authed = os.block.use(requireUser);

export const blockRouter = {
  createBlock: os.block.createBlock.handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    if (input.blockingId === userId) {
      throw new ORPCError("BAD_REQUEST", { message: "You cannot block yourself" });
    }

    const [created] = await rethrowPgError(
      context.db
        .insert(block)
        .values({
          blockerId: userId,
          blockingId: input.blockingId,
        })
        .onConflictDoNothing()
        .returning(),
      FOREIGN_KEY_VIOLATION,
      () => new ORPCError("NOT_FOUND", { message: "User not found" }),
    );

    const existing =
      created ??
      (await context.db.query.block.findFirst({
        where: { blockerId: userId, blockingId: input.blockingId },
      }));

    return {
      block: existing,
    };
  }),

  deleteBlock: authed.deleteBlock.handler(async ({ context, input }) => {
    // WARNING: keep the where scoped to context.user.id, or any caller can delete anyone's blocks.
    const [deleted] = await context.db
      .delete(block)
      .where(and(eq(block.blockerId, context.user.id), eq(block.blockingId, input.blockingId)))
      .returning();

    return {
      block: deleted,
    };
  }),

  /** The blocker's own inventory of blocks. `requireUser` + a `blockerId`
      scoped to `context.user.id`: the actor never comes from client input. */
  listBlocks: authed.listBlocks.handler(async ({ context }) => {
    const blocks = await context.db.query.block.findMany({
      where: { blockerId: context.user.id },
      with: {
        user_blockingId: {
          columns: { displayImage: true, displayName: true, id: true },
        },
      },
    });

    return {
      blocks: blocks.map((row) => ({
        blockingId: row.blockingId,
        displayImage: row.user_blockingId.displayImage,
        displayName: row.user_blockingId.displayName,
      })),
    };
  }),
};
