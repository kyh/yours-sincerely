import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@repo/contracts/auth";
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
  signSession,
} from "./session-core";

// Product decision: sessions are effectively permanent — nobody is logged out
// for inactivity. `COOKIE_SECRET` (from the env, required outside development
// and test) is the ROOT secret; purpose-scoped sub-keys are derived from it, so
// a session signature and a push-cleanup capability signature are
// cryptographically unrelated and neither can be replayed as the other.
//
// `COOKIE_SECRET_LEGACY` is a comma-separated list of ROOT secrets accepted for
// VERIFICATION ONLY, permanently — so rotating the signer never logs anyone out.
// To retire a signer without logging anyone out, move its value into
// COOKIE_SECRET_LEGACY before swapping COOKIE_SECRET.
//
// The raw root secrets are ALSO accepted for verification, permanently: cookies
// minted before key derivation existed are signed with the raw secret and are
// live in browsers and in the Expo app's SecureStore. Sliding renewal migrates
// them onto the derived key over time.
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

// 400 days is the max lifetime browsers honor for a cookie; sliding renewal
// (renewSessionIfStale) resets it on every visit, so an active web user never
// expires, and the native app persists the value in SecureStore indefinitely.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // 400 days (browser cap)
const SESSION_RENEW_AFTER_SECONDS = 60 * 60 * 24 * 7; // renew if older than 7 days

export const createPushCleanupCapability = (userId: string) => {
  return signPushCleanupCapability(userId, PUSH_CLEANUP_KEY);
};

export const verifyPushCleanupCapability = (capability: string) =>
  parsePushCleanupCapability(capability, PUSH_CLEANUP_VERIFY_SECRETS);

/**
 * Verify the session cookie and resolve it to a user, rejecting revoked
 * sessions. `findUser` is the lookup the request context already performs, so
 * the epoch check costs no extra query.
 */
export const getSessionUser = async <TUser extends { sessionEpoch: number }>(
  findUser: (userId: string) => Promise<TUser | null>,
): Promise<TUser | null> => {
  const cookieStore = await cookies();
  return authenticateSessionValue(cookieStore.get(SESSION_COOKIE_NAME)?.value, findUser);
};

/**
 * `getSessionUser` without the cookie store. Production reaches it through
 * `getSessionUser`; `session-revocation.integration.ts` calls it directly with
 * the real database, so the tested path and the shipped path cannot diverge.
 */
export const authenticateSessionValue = <TUser extends { sessionEpoch: number }>(
  sessionValue: string | null | undefined,
  findUser: (userId: string) => Promise<TUser | null>,
): Promise<TUser | null> =>
  resolveSessionUser({ sessionValue, verifySecrets: SESSION_VERIFY_SECRETS, findUser });

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

  cookieStore.set(SESSION_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    // Every non-local environment is HTTPS. A session cookie sent in the clear
    // from a staging box is interceptable, and the cookie IS the identity.
    secure: !IS_LOCAL_ENV,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
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
 * renew itself back into validity. (The caller also only reaches this after the
 * epoch gate in `getSessionUser` has passed, so a revoked session never gets
 * this far in the first place.)
 */
export const renewSessionIfStale = async (sessionEpoch: number) => {
  const cookieStore = await cookies();

  const { decision, payload } = decideRenewal({
    sessionValue: cookieStore.get(SESSION_COOKIE_NAME)?.value,
    verifySecrets: SESSION_VERIFY_SECRETS,
    activeSecret: SESSION_KEY,
    nowSeconds: Math.floor(Date.now() / 1000),
    renewAfterSeconds: SESSION_RENEW_AFTER_SECONDS,
  });

  if (decision !== "renew" || payload === null) {
    return;
  }

  try {
    await setSession(payload.user, sessionEpoch);
  } catch {
    // cookies().set throws outside route handlers / server actions (RSC render)
  }
};

/**
 * Clear the session cookie
 */
export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  // Clear any lingering Supabase auth cookies (migration period)
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }
};

export const createTempPassword = async () => {
  const tempPassword = generateToken();
  return await createPasswordHash(tempPassword);
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

const generateToken = () => {
  return randomBytes(20).toString("hex");
};
