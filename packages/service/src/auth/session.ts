import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@repo/contract/auth/auth-schema";
import { compare, hash } from "bcryptjs";

import { parsePushCleanupCapability, signPushCleanupCapability } from "./push-cleanup-capability";
import {
  buildVerifySecrets,
  decideRenewal,
  deriveKey,
  encodeSessionPayload,
  isLocalEnv,
  parseLegacySecrets,
  PUSH_CLEANUP_PURPOSE,
  resolveCookieSecret,
  resolveSessionUser,
  SESSION_PURPOSE,
  sessionCookieOptions,
  signSession,
} from "./session-core";

// WARNING: raw root secrets and COOKIE_SECRET_LEGACY stay accepted for verification forever; dropping either logs out live sessions.
const COOKIE_SECRET = resolveCookieSecret(process.env);
const LEGACY_SECRETS = parseLegacySecrets(process.env.COOKIE_SECRET_LEGACY);
const IS_LOCAL_ENV = isLocalEnv(process.env.NODE_ENV);

const SESSION_KEY = deriveKey(COOKIE_SECRET, SESSION_PURPOSE);

const SESSION_VERIFY_SECRETS = buildVerifySecrets({
  activeSecret: COOKIE_SECRET,
  legacySecrets: LEGACY_SECRETS,
  purpose: SESSION_PURPOSE,
});

const PUSH_CLEANUP_KEY = deriveKey(COOKIE_SECRET, PUSH_CLEANUP_PURPOSE);

const PUSH_CLEANUP_VERIFY_SECRETS = buildVerifySecrets({
  activeSecret: COOKIE_SECRET,
  legacySecrets: LEGACY_SECRETS,
  purpose: PUSH_CLEANUP_PURPOSE,
});

const SESSION_RENEW_AFTER_SECONDS = 60 * 60 * 24 * 7;

export const createPushCleanupCapability = (userId: string) =>
  signPushCleanupCapability(userId, PUSH_CLEANUP_KEY);

export const verifyPushCleanupCapability = (capability: string) =>
  parsePushCleanupCapability(capability, PUSH_CLEANUP_VERIFY_SECRETS);

/**
 * Verify a session cookie value and resolve it to a user, rejecting revoked
 * sessions. `findUser` is the lookup the request context already performs, so
 * the epoch check costs no extra query. `createORPCContext` calls it with the
 * cookie read from the request headers; `session-revocation.integration.ts`
 * calls it with the real database, so the tested path and the shipped path
 * cannot diverge.
 */
export const authenticateSessionValue = <TUser extends { sessionEpoch: number }>(
  sessionValue: string | null | undefined,
  findUser: (userId: string) => Promise<TUser | null>,
) => resolveSessionUser({ findUser, sessionValue, verifySecrets: SESSION_VERIFY_SECRETS });

/**
 * Issue a session cookie for `userId` at the user's CURRENT `sessionEpoch`.
 *
 * The epoch is a required parameter on purpose: every call site must fetch the
 * live value. Passing a stale or hardcoded epoch silently breaks revocation.
 */
export const setSession = async (userId: string, sessionEpoch: number) => {
  if (!userId) {
    return null;
  }

  const cookieStore = await cookies();
  const payload = encodeSessionPayload(userId, Math.floor(Date.now() / 1000), sessionEpoch);
  const signedCookie = signSession(payload, SESSION_KEY);

  cookieStore.set(SESSION_COOKIE_NAME, signedCookie, sessionCookieOptions(IS_LOCAL_ENV));
};

/**
 * Sliding renewal: re-issue the session cookie (fresh maxAge) when it was
 * issued more than SESSION_RENEW_AFTER_SECONDS ago, has a legacy payload
 * without `iat`, or is still signed by a superseded key. This is what keeps an
 * active session from ever expiring. No-op when there is no validly signed
 * session.
 *
 * `sessionEpoch` MUST be the user's live value from the database — the caller
 * has already loaded the user row. The epoch inside the old cookie is
 * deliberately never read here: re-signing with it would let a revoked session
 * renew itself back into validity. (The caller also only reaches this after
 * the epoch gate in `authenticateSessionValue` has passed, so a revoked
 * session never gets this far in the first place.)
 */
export const renewSessionIfStale = async (
  sessionValue: string | undefined,
  sessionEpoch: number,
) => {
  const { decision, payload } = decideRenewal({
    activeSecret: SESSION_KEY,
    nowSeconds: Math.floor(Date.now() / 1000),
    renewAfterSeconds: SESSION_RENEW_AFTER_SECONDS,
    sessionValue,
    verifySecrets: SESSION_VERIFY_SECRETS,
  });

  if (decision !== "renew" || payload === null) {
    return;
  }

  await setSession(payload.user, sessionEpoch).catch(() => null);
};

/**
 * Clear the session cookie
 */
export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }
};

const SALT_ROUNDS = 10;

export const createPasswordHash = async (password: string) => {
  const passwordHash = await hash(password, SALT_ROUNDS);

  return passwordHash;
};

export const validatePassword = async (password: string, passwordHash: string) => {
  const isMatchingPassword = await compare(password, passwordHash);

  return isMatchingPassword;
};
