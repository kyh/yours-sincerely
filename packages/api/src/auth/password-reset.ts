import type { Db } from "@repo/db/drizzle-client";
import { token as tokenTable } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";
import { and, eq, isNull, lt } from "drizzle-orm";

import { findUserByEmail } from "./email-identity";
import type { SendResetEmail } from "./password-reset-core";
import {
  buildResetUrl,
  createResetToken,
  hashResetToken,
  RESET_TOKEN_EXPIRY_HOURS,
} from "./password-reset-core";

/**
 * A reset link must be single-use, and issuing a new one must burn the old
 * ones. `issuedBefore` limits the burn to links older than that one.
 */
export const burnResetTokens = (db: Pick<Db, "update">, userId: string, issuedBefore?: string) =>
  db
    .update(tokenTable)
    .set({ usedAt: new Date().toISOString() })
    .where(
      and(
        eq(tokenTable.userId, userId),
        eq(tokenTable.type, "RESET_PASSWORD"),
        isNull(tokenTable.usedAt),
        issuedBefore === undefined ? undefined : lt(tokenTable.createdAt, issuedBefore),
      ),
    );

interface PasswordResetRequest {
  userId: string;
  email: string;
  appUrl: string;
  send: SendResetEmail;
}

/**
 * Stores a new reset link, emails it, and only then burns the older ones, so a
 * failed send leaves the user holding the links that already worked instead of
 * none. The failure is rethrown: the caller must not report success.
 */
export const issuePasswordReset = async (
  db: Db,
  { appUrl, email, send, userId }: PasswordResetRequest,
) => {
  const resetToken = createResetToken();

  const [issued] = await db
    .insert(tokenTable)
    .values({
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      sentTo: email,
      token: hashResetToken(resetToken),
      type: "RESET_PASSWORD",
      userId,
    })
    .returning({ createdAt: tokenTable.createdAt, id: tokenTable.id });

  if (!issued) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Unable to issue reset link" });
  }

  try {
    await send({ resetUrl: buildResetUrl(appUrl, resetToken), to: email });
  } catch (error) {
    await db.delete(tokenTable).where(eq(tokenTable.id, issued.id));
    throw error;
  }

  // Older, not "every other": a concurrent request's newer link must survive
  // this one's burn, or a double-click leaves the user with no working link.
  await burnResetTokens(db, userId, issued.createdAt);
};

/**
 * Sends a reset link to the account `address` names. An unknown or ambiguous
 * address sends nothing, and the caller reports success either way. The link
 * goes to the address on file, not the one typed: they can differ in case, and
 * only the stored one is known to reach the owner.
 */
export const sendPasswordReset = async (
  db: Db,
  { address, appUrl, send }: { address: string; appUrl: string; send: SendResetEmail },
) => {
  const account = await findUserByEmail(db, address);
  if (account?.email === null || account?.email === undefined) {
    return;
  }

  await issuePasswordReset(db, { appUrl, email: account.email, send, userId: account.id });
};
