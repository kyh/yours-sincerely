import { and, eq } from "@repo/db";
import { pushToken } from "@repo/db/drizzle-schema";
import { registerPushTokenInput, unregisterPushTokenInput } from "@repo/contracts/notifications";
import { ORPCError } from "@orpc/server";

import { verifyPushCleanupCapability } from "../auth/session";
import { protectedProcedure, publicProcedure } from "../orpc";

export const pushRouter = {
  /** The token is the row's identity, so a device that signs into a second
      account simply moves: the previous owner stops receiving pushes on it. */
  register: protectedProcedure.input(registerPushTokenInput).handler(async ({ context, input }) => {
    const lastSeenAt = new Date().toISOString();

    await context.db
      .insert(pushToken)
      .values({
        token: input.token,
        userId: context.user.id,
        platform: input.platform,
        lastSeenAt,
      })
      .onConflictDoUpdate({
        target: pushToken.token,
        set: { userId: context.user.id, platform: input.platform, lastSeenAt },
      });

    return { success: true };
  }),

  /** Public because it runs AFTER sign-out, when the device no longer has a
      session — the capability minted while signed in is what authorizes it. */
  unregister: publicProcedure
    .input(unregisterPushTokenInput)
    .handler(async ({ context, input }) => {
      const userId = verifyPushCleanupCapability(input.capability);
      if (userId === null) throw new ORPCError("UNAUTHORIZED");

      await context.db
        .delete(pushToken)
        .where(and(eq(pushToken.token, input.token), eq(pushToken.userId, userId)));

      return { success: true };
    }),
};
