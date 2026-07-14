import { flag } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { createFlagInput } from "./flag-schema";

export const flagRouter = createTRPCRouter({
  createFlag: publicProcedure.input(createFlagInput).mutation(async ({ ctx, input }) => {
    const userId = await createUserIfNotExists(ctx);

    // Flag_pkey is (postId, userId). Flagging the same post twice is a no-op,
    // not a unique-violation 500.
    //
    // Anyone may SUBMIT a flag, including a brand-new cookieless identity — the
    // row is always recorded. Whether it COUNTS toward auto-hide is decided by
    // the database, once, at insert time: the `flag_counts_toward_hide` trigger
    // sets `countsTowardHide` from the `isEstablishedFlagger` function. That is
    // the single definition of the rule; never set the column from here.
    const [created] = await ctx.db
      .insert(flag)
      .values({
        ...getDefaultValues({ withId: false }),
        postId: input.postId,
        userId,
        comment: input.reason,
      })
      .onConflictDoNothing()
      .returning();

    // `onConflictDoNothing().returning()` yields nothing when the row already
    // existed, so read it back rather than handing the client an `undefined`.
    const existing =
      created ??
      (await ctx.db.query.flag.findFirst({
        where: (row, { and, eq }) => and(eq(row.postId, input.postId), eq(row.userId, userId)),
      }));

    return {
      flag: existing,
    };
  }),
});
