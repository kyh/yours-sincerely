import { eq } from "@repo/db";
import { user, userStats } from "@repo/db/drizzle-schema";

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
});
