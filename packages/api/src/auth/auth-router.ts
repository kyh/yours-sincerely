import { token, user } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";
import { eq, and, isNull, gt } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  requestPasswordResetInput,
  signInWithPasswordInput,
  signUpInput,
  updatePasswordInput,
} from "./auth-schema";
import {
  clearSession,
  createPasswordHash,
  setSession,
  validatePassword,
} from "./session";

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

      // Generate reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await ctx.db.insert(token).values({
        ...getDefaultValues(),
        token: resetToken,
        type: "RESET_PASSWORD",
        expiresAt: expiresAt.toISOString(),
        sentTo: input.email,
        userId: existingUser.id,
      });

      // TODO: Send email with reset link containing resetToken
      // For now, log the token in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Password reset token for ${input.email}: ${resetToken}`);
      }

      return { success: true };
    }),
  resetPassword: publicProcedure
    .input(
      signUpInput.pick({ password: true }).extend({
        token: signInWithPasswordInput.shape.password,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tokenRecord = await ctx.db.query.token.findFirst({
        where: (t) =>
          and(
            eq(t.token, input.token),
            eq(t.type, "RESET_PASSWORD"),
            isNull(t.usedAt),
            gt(t.expiresAt, new Date().toISOString()),
          ),
      });

      if (!tokenRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      const passwordHash = await createPasswordHash(input.password);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ passwordHash })
          .where(eq(user.id, tokenRecord.userId));

        await tx
          .update(token)
          .set({ usedAt: new Date().toISOString() })
          .where(eq(token.id, tokenRecord.id));
      });

      return { success: true };
    }),
  updatePassword: protectedProcedure
    .input(updatePasswordInput)
    .mutation(async ({ ctx, input }) => {
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
      const isValid = await validatePassword(
        input.currentPassword,
        currentUser.passwordHash,
      );

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const passwordHash = await createPasswordHash(input.newPassword);

      await ctx.db
        .update(user)
        .set({ passwordHash })
        .where(eq(user.id, ctx.user.id));

      // Rotate session after password change
      await setSession(ctx.user.id);

      return { success: true };
    }),
});
