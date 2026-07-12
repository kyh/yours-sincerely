import { randomBytes } from "crypto";
import { NotFoundError } from "@knocklabs/node";
import { token as tokenTable, user } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";

import { createKnockUserToken, getKnockClient } from "../knock";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  requestPasswordResetInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
} from "./auth-schema";
import {
  clearSession,
  createPasswordHash,
  createPushCleanupCapability,
  setSession,
  validatePassword,
  verifyPushCleanupCapability,
} from "./session";

const RESET_TOKEN_EXPIRY_HOURS = 1;
const cleanupPushDeviceInput = z.object({
  capability: z.string().min(1),
  token: z.string().min(1),
});
const knockPushChannelData = z.object({
  devices: z.array(z.looseObject({ token: z.string() })),
});
const APP_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://yourssincerely.org";

const sanitizeUser = <T extends { passwordHash?: string | null }>(
  user: T,
): Omit<T, "passwordHash"> => {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

export const authRouter = createTRPCRouter({
  workspace: publicProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      knockUserToken: ctx.user === null ? null : await createKnockUserToken(ctx.user.id),
      pushCleanupCapability: ctx.user === null ? null : createPushCleanupCapability(ctx.user.id),
    };
  }),
  knockUserToken: protectedProcedure.query(async ({ ctx }) => ({
    token: await createKnockUserToken(ctx.user.id),
  })),
  cleanupPushDevice: publicProcedure.input(cleanupPushDeviceInput).mutation(async ({ input }) => {
    const userId = verifyPushCleanupCapability(input.capability);
    if (userId === null) throw new TRPCError({ code: "UNAUTHORIZED" });

    const knock = getKnockClient();
    const channelId = process.env.NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID;
    if (knock === null || channelId === undefined) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Push cleanup is not configured",
      });
    }

    try {
      const channelData = await knock.users.getChannelData(userId, channelId);
      const parsed = knockPushChannelData.safeParse(channelData.data);
      if (!parsed.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid push channel data",
        });
      }

      await knock.users.setChannelData(userId, channelId, {
        data: {
          devices: parsed.data.devices.filter((device) => device.token !== input.token),
        },
      });
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
    }

    return { success: true };
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

    if (ctx.user?.email !== null && ctx.user?.email !== undefined) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Current user is already registered",
      });
    }

    const passwordHash = await createPasswordHash(input.password);

    const [newUser] = ctx.user
      ? await ctx.db
          .update(user)
          .set({ email: input.email, passwordHash })
          .where(eq(user.id, ctx.user.id))
          .returning()
      : await ctx.db
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

      // One HTTPS link serves every client. Associated domains open the
      // installed app; browsers remain the universal fallback.
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
});
