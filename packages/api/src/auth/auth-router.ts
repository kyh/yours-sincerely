import { randomBytes } from "crypto";
import { token as tokenTable, user } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  requestPasswordResetInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
  updatePasswordInput,
  verifyResetTokenInput,
} from "./auth-schema";
import { clearSession, createPasswordHash, setSession, validatePassword } from "./session";

const RESET_TOKEN_EXPIRY_HOURS = 1;
const APP_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://yourssincerely.org";

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
    await clearSession();

    return { user: null };
  }),
  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInput)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, input.email),
      });

      // Always return success to prevent email enumeration
      if (!existingUser) {
        return { success: true };
      }

      const resetToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await ctx.db.insert(tokenTable).values({
        ...getDefaultValues(),
        token: resetToken,
        type: "RESET_PASSWORD",
        expiresAt: expiresAt.toISOString(),
        sentTo: input.email,
        userId: existingUser.id,
      });

      const resetUrl = `${APP_URL}/auth/password-update?token=${resetToken}`;
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "Yours Sincerely <noreply@yourssincerely.org>",
        to: input.email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in ${RESET_TOKEN_EXPIRY_HOURS} hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });

      return { success: true };
    }),
  verifyResetToken: publicProcedure
    .input(verifyResetTokenInput)
    .query(async ({ ctx, input }) => {
      const resetToken = await ctx.db.query.token.findFirst({
        where: (t, { and, eq, gt, isNull }) =>
          and(
            eq(t.token, input.token),
            eq(t.type, "RESET_PASSWORD"),
            gt(t.expiresAt, new Date().toISOString()),
            isNull(t.usedAt),
          ),
      });

      return { valid: !!resetToken };
    }),
  setPassword: publicProcedure.input(setPasswordInput).mutation(async ({ ctx, input }) => {
    const resetToken = await ctx.db.query.token.findFirst({
      where: (t, { and, eq, gt, isNull }) =>
        and(
          eq(t.token, input.token),
          eq(t.type, "RESET_PASSWORD"),
          gt(t.expiresAt, new Date().toISOString()),
          isNull(t.usedAt),
        ),
    });

    if (!resetToken) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid or expired reset token",
      });
    }

    const passwordHash = await createPasswordHash(input.password);

    await ctx.db.update(user).set({ passwordHash }).where(eq(user.id, resetToken.userId));

    // Mark token as used
    await ctx.db
      .update(tokenTable)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(tokenTable.id, resetToken.id));

    await setSession(resetToken.userId);

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
