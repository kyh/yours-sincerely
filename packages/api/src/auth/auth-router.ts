import { ANONYMOUS_DISPLAY_NAME } from "@repo/contracts/user";
import type { Db } from "@repo/db/drizzle-client";
import { token as tokenTable, user } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { Resend } from "resend";

import { env } from "../env";
import { protectedProcedure, publicProcedure } from "../orpc";
import { rethrowPgError, UNIQUE_VIOLATION } from "../pg-error";
import {
  requestPasswordResetInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
} from "./auth-schema";
import { findUserByEmail, isEmailTaken } from "./email-identity";
import { burnResetTokens, sendPasswordReset } from "./password-reset";
import { createResetEmailSender, hashResetToken } from "./password-reset-core";
import {
  clearSession,
  createPasswordHash,
  createPushCleanupCapability,
  setSession,
  validatePassword,
} from "./session";
import { toViewer } from "./session-user";

/**
 * Revoke every session this user holds, anywhere, and return the new epoch.
 * The bump invalidates all cookies already issued; the caller decides whether
 * to hand the current device a fresh one.
 */
const revokeUserSessions = async (db: Pick<Db, "update">, userId: string) => {
  const [updated] = await db
    .update(user)
    .set({ sessionEpoch: sql`${user.sessionEpoch} + 1` })
    .where(eq(user.id, userId))
    .returning({ sessionEpoch: user.sessionEpoch });

  if (!updated) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unable to revoke sessions" });
  }

  return updated.sessionEpoch;
};

export const authRouter = {
  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInput)
    .handler(async ({ context, input }) => {
      // Checked before the lookup: a deployment with no email provider can
      // never deliver the link, so refuse outright. The answer does not depend
      // on `input.email`, so it leaks no enumeration.
      const resendApiKey = env.RESEND_API_KEY;
      if (resendApiKey === undefined) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: "Password reset email is not configured",
        });
      }

      await sendPasswordReset(context.db, {
        address: input.email,
        appUrl: env.RESET_LINK_ORIGIN,
        send: createResetEmailSender(new Resend(resendApiKey).emails),
      });

      // Always return success to prevent email enumeration
      return { success: true };
    }),
  setPassword: publicProcedure.input(setPasswordInput).handler(async ({ context, input }) => {
    const now = new Date().toISOString();

    // One transaction: the new password never lands without the revocation
    // that has to come with it.
    const redeemed = await context.db.transaction(async (tx) => {
      // The claim IS the check. Only a live, unused link matches, so of two
      // concurrent redemptions exactly one gets a row back.
      const [claimed] = await tx
        .update(tokenTable)
        .set({ usedAt: now })
        .where(
          and(
            eq(tokenTable.token, hashResetToken(input.token)),
            eq(tokenTable.type, "RESET_PASSWORD"),
            isNull(tokenTable.usedAt),
            gt(tokenTable.expiresAt, now),
          ),
        )
        .returning({ userId: tokenTable.userId });

      if (!claimed) {
        throw new ORPCError("BAD_REQUEST", { message: "Invalid or expired reset token" });
      }

      // Hashed only after the claim, so a garbage token costs no bcrypt.
      const passwordHash = await createPasswordHash(input.password);
      await tx.update(user).set({ passwordHash }).where(eq(user.id, claimed.userId));

      // A password reset is the remediation a user reaches for after "someone
      // got into my account", so every session an attacker already holds must
      // die here, along with any other outstanding link.
      const sessionEpoch = await revokeUserSessions(tx, claimed.userId);
      await burnResetTokens(tx, claimed.userId);

      return { sessionEpoch, userId: claimed.userId };
    });

    // Only once the revocation has committed, re-admit the person who actually
    // did the reset.
    await setSession(redeemed.userId, redeemed.sessionEpoch);

    return { success: true };
  }),
  signInWithPassword: publicProcedure
    .input(signInWithPasswordInput)
    .handler(async ({ context, input }) => {
      const existingUser = await findUserByEmail(context.db, input.email);

      if (!existingUser?.passwordHash) {
        throw new ORPCError("UNAUTHORIZED", { message: "Invalid email or password" });
      }

      const isValid = await validatePassword(input.password, existingUser.passwordHash);

      if (!isValid) {
        throw new ORPCError("UNAUTHORIZED", { message: "Invalid email or password" });
      }

      await setSession(existingUser.id, existingUser.sessionEpoch);

      return {
        user: toViewer(existingUser),
      };
    }),
  /** Normal sign-out: clears this device's cookie only. Correct semantic. */
  signOut: protectedProcedure.handler(async () => {
    await clearSession();

    return { user: null };
  }),
  /**
   * Revoke every session for this account, on every device — including any
   * cookie an attacker captured. Logs out the calling device too.
   */
  signOutEverywhere: protectedProcedure.handler(async ({ context }) => {
    await revokeUserSessions(context.db, context.user.id);
    await clearSession();

    return { user: null };
  }),
  signUp: publicProcedure.input(signUpInput).handler(async ({ context, input }) => {
    if (await isEmailTaken(context.db, input.email)) {
      throw new ORPCError("CONFLICT", { message: "User already registered" });
    }

    if (context.user?.email !== null && context.user?.email !== undefined) {
      throw new ORPCError("CONFLICT", { message: "Current user is already registered" });
    }

    const passwordHash = await createPasswordHash(input.password);

    // The lookup above can race a concurrent sign-up; the unique index decides.
    const [newUser] = await rethrowPgError(
      context.user
        ? context.db
            .update(user)
            .set({ email: input.email, passwordHash })
            .where(eq(user.id, context.user.id))
            .returning()
        : context.db
            .insert(user)
            .values({
              displayName: ANONYMOUS_DISPLAY_NAME,
              email: input.email,
              passwordHash,
            })
            .returning(),
      UNIQUE_VIOLATION,
      () => new ORPCError("CONFLICT", { message: "User already registered" }),
    );

    if (!newUser) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unable to create user" });
    }

    await setSession(newUser.id, newUser.sessionEpoch);

    return {
      user: toViewer(newUser),
    };
  }),
  workspace: publicProcedure.handler(({ context }) => ({
    pushCleanupCapability:
      context.user === null ? null : createPushCleanupCapability(context.user.id),
    user: context.user === null ? null : toViewer(context.user),
  })),
};
