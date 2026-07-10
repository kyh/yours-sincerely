import { eq, inArray, or } from "@repo/db";
import {
  account,
  block,
  enrolledEvent,
  flag,
  like,
  post,
  token,
  user,
  userStats,
} from "@repo/db/drizzle-schema";

import { clearSession } from "../auth/session";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getUserInput, getUserStatsInput, updateUserInput } from "./user-schema";

export const userRouter = createTRPCRouter({
  getUser: publicProcedure.input(getUserInput).query(async ({ ctx, input }) => {
    const response = await ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, input.userId),
    });

    return {
      user: response,
    };
  }),

  getUserStats: publicProcedure.input(getUserStatsInput).query(async ({ ctx, input }) => {
    const [stats] = await ctx.db.select().from(userStats).where(eq(userStats.userId, input.userId));

    return {
      userStats: stats,
    };
  }),

  updateUser: protectedProcedure.input(updateUserInput).mutation(async ({ ctx, input }) => {
    const updates: Partial<typeof user.$inferInsert> = {};

    if (input.email) {
      updates.email = input.email;
    }

    if (input.displayName) {
      updates.displayName = input.displayName;
    }

    const [response] = await ctx.db
      .update(user)
      .set(updates)
      .where(eq(user.id, input.userId))
      .returning();

    return {
      user: response,
    };
  }),

  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    await ctx.db.transaction(async (tx) => {
      const userPosts = await tx.select({ id: post.id }).from(post).where(eq(post.userId, userId));
      const userPostIds = userPosts.map((row) => row.id);

      if (userPostIds.length > 0) {
        const childPosts = await tx
          .select({ id: post.id })
          .from(post)
          .where(inArray(post.parentId, userPostIds));
        const affectedPostIds = [...userPostIds, ...childPosts.map((row) => row.id)];

        await tx
          .delete(like)
          .where(or(eq(like.userId, userId), inArray(like.postId, affectedPostIds)));
        await tx
          .delete(flag)
          .where(or(eq(flag.userId, userId), inArray(flag.postId, affectedPostIds)));
        // Child comments reference their parent post, so they go first
        await tx.delete(post).where(inArray(post.parentId, userPostIds));
        await tx.delete(post).where(eq(post.userId, userId));
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
});
