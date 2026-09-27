import { flag } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { publicProcedure } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";
import { createFlagInput } from "./flag-schema";

export const flagRouter = {
  createFlag: publicProcedure.input(createFlagInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    // Flag_pkey is (postId, userId). Flagging the same post twice is a no-op,
    // not a unique-violation 500.
    //
    // Anyone may SUBMIT a flag, including a brand-new cookieless identity — the
    // row is always recorded. Whether it COUNTS toward auto-hide is decided by
    // the database, once, at insert time: the `flag_counts_toward_hide` trigger
    // sets `countsTowardHide` from the `isEstablishedFlagger` function. That is
    // the single definition of the rule; never set the column from here.
    await rethrowPgError(
      context.db
        .insert(flag)
        .values({
          comment: input.reason,
          postId: input.postId,
          userId,
        })
        .onConflictDoNothing(),
      FOREIGN_KEY_VIOLATION,
      () => new ORPCError("NOT_FOUND", { message: "Post not found" }),
    );

    // Only the key goes back: the stored row would tell whoever is minting
    // identities which of them carry moderation authority (`countsTowardHide`).
    return {
      flag: { postId: input.postId },
    };
  }),
};
