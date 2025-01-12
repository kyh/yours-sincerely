import { eq } from "@init/db";
import { user, userStats } from "@init/db/schema";
import { getSupabaseAdminClient } from "@init/db/supabase-admin-client";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
} from "../trpc";
import {
  createUserInput,
  deleteUserInput,
  getUserInput,
  getUserStatsInput,
  impersonateUserInput,
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

      return {
        user: response,
      };
    }),

  // ADMIN ACTIONS
  createUser: superAdminProcedure
    .input(createUserInput)
    .mutation(async ({ input }) => {
      const client = getSupabaseAdminClient();
      const { email, ...metadata } = input;

      const response = await client.auth.admin.createUser({
        email,
        user_metadata: metadata,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  deleteUser: superAdminProcedure
    .input(deleteUserInput)
    .mutation(async ({ input }) => {
      const client = getSupabaseAdminClient();

      const response = await client.auth.admin.deleteUser(input.userId, true);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  impersonateUser: superAdminProcedure
    .input(impersonateUserInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error(
          `You cannot perform a destructive action on your own account as a Super Admin`,
        );
      }
      const client = getSupabaseAdminClient();

      const {
        data: { user },
        error,
      } = await client.auth.admin.getUserById(input.userId);

      if (error ?? !user) {
        throw new Error(`Error fetching user`);
      }

      const email = user.email;

      if (!email) {
        throw new Error(`User has no email. Cannot impersonate`);
      }

      const { error: linkError, data } = await client.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `/`,
        },
      });

      if (linkError ?? !data) {
        throw new Error(`Error generating magic link`);
      }

      const response = await fetch(data.properties.action_link, {
        method: "GET",
        redirect: "manual",
      });

      const location = response.headers.get("Location");

      if (!location) {
        throw new Error(
          `Error generating magic link. Location header not found`,
        );
      }

      const hash = new URL(location).hash.substring(1);
      const query = new URLSearchParams(hash);
      const accessToken = query.get("access_token");
      const refreshToken = query.get("refresh_token");

      if (!accessToken || !refreshToken) {
        throw new Error(
          `Error generating magic link. Tokens not found in URL hash.`,
        );
      }

      return {
        accessToken,
        refreshToken,
      };
    }),
});
