import { user } from "@repo/db/drizzle-schema";
import { getSupabaseServerClient } from "@repo/db/supabase-server-client";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  requestPasswordResetInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
  updatePasswordInput,
} from "./auth-schema";
import { clearSession, createPasswordHash, setSession, validatePassword } from "./session";

const sanitizeUser = <T extends { passwordHash?: string | null }>(
  user: T,
): Omit<T, "passwordHash"> => {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

export const authRouter = createTRPCRouter({
  workspace: publicProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),
  signUp: publicProcedure.input(signUpInput).mutation(async ({ ctx, input }) => {
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

    await setSession(newUser.id);

    return {
      user: sanitizeUser(newUser),
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

      const isValid = await validatePassword(input.password, existingUser.passwordHash);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await setSession(existingUser.id);

      return {
        user: sanitizeUser(existingUser),
      };
    }),
  signOut: protectedProcedure.mutation(async () => {
    // Clear custom session
    await clearSession();

    // Also clear Supabase session during migration period
    const supabase = getSupabaseServerClient();
    await supabase.auth.signOut();

    return { user: null };
  }),
  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInput)
    .mutation(async ({ input }) => {
      // Use Supabase to send password reset email
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.auth.resetPasswordForEmail(input.email);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send password reset email",
        });
      }

      return { success: true };
    }),
  // Used after password reset flow - user has valid session from Supabase token verification
  setPassword: protectedProcedure.input(setPasswordInput).mutation(async ({ ctx, input }) => {
    const passwordHash = await createPasswordHash(input.password);

    await ctx.db.update(user).set({ passwordHash }).where(eq(user.id, ctx.user.id));

    // Rotate session after password change
    await setSession(ctx.user.id);

    return { success: true };
  }),
  updatePassword: protectedProcedure.input(updatePasswordInput).mutation(async ({ ctx, input }) => {
    // Get current user with password hash
    const currentUser = await ctx.db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.user.id),
    });

    if (!currentUser?.passwordHash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot update password for this account",
      });
    }

    // Verify current password
    const isValid = await validatePassword(input.currentPassword, currentUser.passwordHash);

    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Current password is incorrect",
      });
    }

    const passwordHash = await createPasswordHash(input.newPassword);

    await ctx.db.update(user).set({ passwordHash }).where(eq(user.id, ctx.user.id));

    // Rotate session after password change
    await setSession(ctx.user.id);

    return { success: true };
  }),
});
