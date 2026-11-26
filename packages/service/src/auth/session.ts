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
 * the epoch check costs no extra query. `authenticateRequestSession` wraps it
 * for each request; `session-revocation.integration.ts` calls it with the real
 * database, so the tested path and the shipped path cannot diverge.
 */
export const authenticateSessionValue = async <TUser extends { sessionEpoch: number }>(
  sessionValue: string | null | undefined,
  findUser: (userId: string) => Promise<TUser | null>,
) => await resolveSessionUser({ findUser, sessionValue, verifySecrets: SESSION_VERIFY_SECRETS });

/**
 * Issue a session cookie for `userId` at the user's CURRENT `sessionEpoch`.
 *
 * The epoch is a required parameter on purpose: every call site must fetch the
 * live value. Passing a stale or hardcoded epoch silently breaks revocation.
 */
export const setSession = async (userId: string, sessionEpoch: number) => {
  if (!userId) {
    return;
  }

  const cookieStore = await cookies();
  const payload = encodeSessionPayload(userId, Math.floor(Date.now() / 1000), sessionEpoch);
  const signedCookie = signSession(payload, SESSION_KEY);

  cookieStore.set(SESSION_COOKIE_NAME, signedCookie, sessionCookieOptions(IS_LOCAL_ENV));
};

// WARNING: sessionEpoch must be the user row's live value; re-signing with the cookie's epoch revives revoked sessions.
const renewSessionIfStale = async (sessionValue: string | undefined, sessionEpoch: number) => {
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
 * A request's session: the user it resolves to, or null. Sliding renewal
 * re-issues the cookie (fresh maxAge) when it was issued more than
 * SESSION_RENEW_AFTER_SECONDS ago, has a legacy payload without `iat`, or is
 * still signed by a superseded key; this is what keeps an active session from
 * ever expiring. Renewal re-signs with the epoch from the user row just
 * loaded, never the cookie's, and runs only after the epoch gate in
 * `authenticateSessionValue` has passed, so a revoked session never renews.
 */
export const authenticateRequestSession = async <TUser extends { sessionEpoch: number }>(
  sessionValue: string | undefined,
  findUser: (userId: string) => Promise<TUser | null>,
) => {
  const user = await authenticateSessionValue(sessionValue, findUser);

  if (user) {
    await renewSessionIfStale(sessionValue, user.sessionEpoch);
  }

  return user;
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
