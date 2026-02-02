import { user } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  requestPasswordResetInput,
  signInWithOAuthInput,
  signInWithPasswordInput,
  signUpInput,
  updatePasswordInput,
} from "./auth-schema";
import {
  clearDeprecatedSession,
  createPasswordHash,
  setDeprecatedSession,
  validatePassword,
} from "./deprecated-session";

export const authRouter = createTRPCRouter({
  workspace: publicProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),
  signUp: publicProcedure
    .input(signUpInput)
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingUser = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already registered",
        });
      }

      const passwordHash = await createPasswordHash(input.password);

      const [newUser] = await ctx.db
        .insert(user)
        .values({
          ...getDefaultValues(),
          email: input.email,
          passwordHash,
          displayName: "Anonymous",
        })
        .returning();

      if (!newUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create user",
        });
      }

      await setDeprecatedSession(newUser.id);

      return {
        user: newUser,
      };
    }),
  signInWithPassword: publicProcedure
    .input(signInWithPasswordInput)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, input.email),
      });

      if (!existingUser?.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValid = await validatePassword(
        input.password,
        existingUser.passwordHash,
      );

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await setDeprecatedSession(existingUser.id);

      return {
        user: existingUser,
      };
    }),
  // Note: OAuth still uses Supabase during migration, session is set in callback
  signInWithOAuth: publicProcedure
    .input(signInWithOAuthInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.auth.signInWithOAuth(input);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    // Clear custom session
    await clearDeprecatedSession();

    // Also clear Supabase session during migration period
    await ctx.supabase.auth.signOut();

    return { user: null };
  }),
  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInput)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.supabase.auth.resetPasswordForEmail(
        input.email,
      );

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),
  updatePassword: protectedProcedure
    .input(updatePasswordInput)
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await createPasswordHash(input.password);

      await ctx.db
        .update(user)
        .set({ passwordHash })
        .where(eq(user.id, ctx.user.id));

      return { success: true };
    }),
});
