import { and, eq } from "@repo/db";
import { pushToken } from "@repo/db/drizzle-schema";
import { pushContract } from "@repo/contracts/push-contract";
import { implement, ORPCError } from "@orpc/server";

import { verifyPushCleanupCapability } from "../auth/session";
import type { ORPCContext } from "../orpc";
import { requireUser } from "../orpc";

const os = implement(pushContract).$context<ORPCContext>();

export const pushRouter = os.router({
  /** The token is the row's identity, so a device that signs into a second
      account simply moves: the previous owner stops receiving pushes on it. */
  register: os.use(requireUser).register.handler(async ({ context, input }) => {
    const lastSeenAt = new Date().toISOString();

    await context.db
      .insert(pushToken)
      .values({
        lastSeenAt,
        platform: input.platform,
        token: input.token,
        userId: context.user.id,
      })
      .onConflictDoUpdate({
        set: { lastSeenAt, platform: input.platform, userId: context.user.id },
        target: pushToken.token,
      });

    return { success: true };
  }),

  /** Public because it runs AFTER sign-out, when the device no longer has a
      session — the capability minted while signed in is what authorizes it. */
  unregister: os.unregister.handler(async ({ context, input }) => {
    const userId = verifyPushCleanupCapability(input.capability);
    if (userId === null) {
      throw new ORPCError("UNAUTHORIZED");
    }

    await context.db
      .delete(pushToken)
      .where(and(eq(pushToken.token, input.token), eq(pushToken.userId, userId)));

    return { success: true };
  }),
});
