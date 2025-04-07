import { eq } from "@kyh/db";
import { user, userStats } from "@kyh/db/schema";
import { getSupabaseAdminClient } from "@kyh/db/supabase-admin-client";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  getUserInput,
  getUserStatsInput,
  updateUserInput,
} from "./user-schema";

export const userRouter = createTRPCRouter({
  getUser: publicProcedure.input(getUserInput).query(async ({ ctx, input }) => {
    const response = await ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, input.userId),
    });

    return {
      user: response,
    };
  }),

  getUserStats: publicProcedure
    .input(getUserStatsInput)
    .query(async ({ ctx, input }) => {
      const [stats] = await ctx.db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, input.userId));

      return {
        userStats: stats,
      };
    }),

  updateUser: protectedProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
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

      // Handle old account case where the supabase user hasn't been created
      if (input.email) {
        const client = getSupabaseAdminClient();
        const { data: supabaseUser } = await client.auth.admin.getUserById(
          input.userId,
        );

        if (!supabaseUser.user) {
          await client.auth.admin.createUser({
            email: input.email,
          });
        } else {
          await client.auth.admin.updateUserById(input.userId, {
            email: input.email,
          });
        }
      }

      return {
        user: response,
      };
    }),
});
