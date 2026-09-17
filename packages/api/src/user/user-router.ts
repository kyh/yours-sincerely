import { eq, inArray, or, sql } from "@repo/db";
import {
  account,
  block,
  enrolledEvent,
  flag,
  like,
  post,
  token,
  user,
} from "@repo/db/drizzle-schema";

import { clearSession } from "../auth/session";
import { collectDescendantPostIds } from "../post/post-utils";
import { protectedProcedure, publicProcedure } from "../orpc";
import { getUserInput, getUserStatsInput, updateUserInput, userStatsRow } from "./user-schema";

/** `public."getUserStats"(text)` — see `sql/040-user-stats.sql`. Quoted because the name is
    camelCase; `sql.raw` would invite injection, an identifier cannot. */
const getUserStatsFn = sql.identifier("getUserStats");

export const userRouter = {
  deleteUser: protectedProcedure.handler(async ({ context }) => {
    const userId = context.user.id;

    // Notification and PushToken rows go with the user row via ON DELETE CASCADE.
    await context.db.transaction(async (tx) => {
      const userPosts = await tx.select({ id: post.id }).from(post).where(eq(post.userId, userId));
      const userPostIds = userPosts.map((row) => row.id);

      if (userPostIds.length > 0) {
        const deletedPostIds = await collectDescendantPostIds(tx, userPostIds);

        await tx
          .delete(like)
          .where(or(eq(like.userId, userId), inArray(like.postId, deletedPostIds)));
        await tx
          .delete(flag)
          .where(or(eq(flag.userId, userId), inArray(flag.postId, deletedPostIds)));
        await tx.delete(post).where(inArray(post.id, deletedPostIds));
      } else {
        await tx.delete(like).where(eq(like.userId, userId));
        await tx.delete(flag).where(eq(flag.userId, userId));
      }

      await tx.delete(token).where(eq(token.userId, userId));
      await tx.delete(account).where(eq(account.userId, userId));
      await tx.delete(enrolledEvent).where(eq(enrolledEvent.userId, userId));
      await tx.delete(block).where(or(eq(block.blockerId, userId), eq(block.blockingId, userId)));
      await tx.delete(user).where(eq(user.id, userId));
    });

    await clearSession();

    return { user: null };
  }),

  getUser: publicProcedure.input(getUserInput).handler(async ({ context, input }) => {
    const response = await context.db.query.user.findFirst({
      columns: {
        displayImage: true,
        displayName: true,
        id: true,
      },
      where: { id: input.userId },
    });

    return {
      user: response,
    };
  }),

  /** Fired on profile-link HOVER, so it is far hotter than it looks.
   *
   *  It used to read the `UserStats` VIEW, which computed streaks for EVERY user
   *  with a window function over every post in the table and only then filtered
   *  to the one asked for — the predicate could not be pushed down. It now calls
   *  the `getUserStats(text)` function, which pushes the userId into the CTEs.
   *  Same columns, same numbers (characterized against the view for all users). */
  getUserStats: publicProcedure.input(getUserStatsInput).handler(async ({ context, input }) => {
    const rows = await context.db.execute(sql`SELECT * FROM ${getUserStatsFn}(${input.userId})`);

    const parsed = userStatsRow.safeParse(rows[0]);

    return {
      // A user with no posts still yields a row (zeros). No row at all means no
      // such user — the clients already render that as "not found".
      userStats: parsed.success ? parsed.data : undefined,
    };
  }),

  updateUser: protectedProcedure.input(updateUserInput).handler(async ({ context, input }) => {
    const updates: Partial<typeof user.$inferInsert> = {};

    if (input.email !== undefined) {
      updates.email = input.email;
    }

    if (input.displayName !== undefined) {
      updates.displayName = input.displayName;
    }

    const [response] = await context.db
      .update(user)
      .set(updates)
      .where(eq(user.id, context.user.id))
      .returning({
        displayImage: user.displayImage,
        displayName: user.displayName,
        email: user.email,
        id: user.id,
      });

    return {
      user: response,
    };
  }),
};
