import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import cookieSignature from "cookie-signature";

// Product decision: sessions are effectively permanent — nobody is logged out
// for inactivity. `COOKIE_SECRET` (from the env, required in production) signs
// every new cookie. `COOKIE_SECRET_LEGACY` is a comma-separated list of secrets
// accepted for VERIFICATION ONLY, permanently — so rotating the signer never
// logs anyone out. To retire a signer without logging anyone out, move its value
// into COOKIE_SECRET_LEGACY before swapping COOKIE_SECRET.
const DEV_SIGNING_SECRET = "dev-insecure-signing-secret"; // local dev only; never used in production

const COOKIE_SECRET = process.env.COOKIE_SECRET ?? DEV_SIGNING_SECRET;
if (!process.env.COOKIE_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("COOKIE_SECRET must be set in production");
}

const VERIFY_SECRETS = [
  COOKIE_SECRET,
  ...(process.env.COOKIE_SECRET_LEGACY ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0),
];

/** Unsign against the active secret first, then any legacy secret. */
const unsignSession = (value: string) => {
  for (const secret of VERIFY_SECRETS) {
    const unsigned = cookieSignature.unsign(value, secret);
    if (unsigned) {
      return unsigned;
    }
  }
  return null;
};

const SESSION_COOKIE_NAME = "__session";
// 400 days is the max lifetime browsers honor for a cookie; sliding renewal
// (renewSessionIfStale) resets it on every visit, so an active web user never
// expires, and the native app persists the value in SecureStore indefinitely.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // 400 days (browser cap)
const SESSION_RENEW_AFTER_SECONDS = 60 * 60 * 24 * 7; // renew if older than 7 days

// Legacy payloads (pre sliding renewal) have no `iat`
const parseSessionPayload = (unsignedCookie: string) => {
  try {
    const parsed: unknown = JSON.parse(atob(unsignedCookie));
    if (typeof parsed !== "object" || parsed === null || !("user" in parsed)) {
      return null;
    }
    const { user } = parsed;
    if (typeof user !== "string") {
      return null;
    }
    const iat = "iat" in parsed && typeof parsed.iat === "number" ? parsed.iat : null;
    return { user, iat };
  } catch {
    return null;
  }
};

/**
 * Get the user ID from the session cookie
 */
export const getSession = async () => {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return null;
  }

  const unsignedCookie = unsignSession(sessionValue);
  if (!unsignedCookie) {
    return null;
  }

  return parseSessionPayload(unsignedCookie)?.user ?? null;
};

/**
 * Set the user ID in the session cookie
 */
export const setSession = async (userId: string) => {
  const cookieStore = await cookies();

  if (!userId) {
    return null;
  }

  const sessionString = JSON.stringify({ user: userId, iat: Math.floor(Date.now() / 1000) });
  const base64Session = Buffer.from(sessionString).toString("base64");
  const signedCookie = cookieSignature.sign(base64Session, COOKIE_SECRET);

  cookieStore.set(SESSION_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
};

/**
 * Sliding renewal: re-issue the session cookie (fresh maxAge) when it was
 * issued more than SESSION_RENEW_AFTER_SECONDS ago, or has a legacy payload
 * without `iat`. This is what keeps an active session from ever expiring.
 * No-op when there is no validly signed session.
 */
export const renewSessionIfStale = async () => {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return;
  }

  const unsignedCookie = unsignSession(sessionValue);
  if (!unsignedCookie) {
    return;
  }

  const payload = parseSessionPayload(unsignedCookie);
  if (!payload) {
    return;
  }

  // Renew when stale OR when the cookie is still signed by a legacy secret, so
  // active sessions migrate onto the active secret promptly after a rotation.
  const ageSeconds = Math.floor(Date.now() / 1000) - (payload.iat ?? 0);
  const signedByActiveSecret = cookieSignature.unsign(sessionValue, COOKIE_SECRET) !== false;
  if (ageSeconds < SESSION_RENEW_AFTER_SECONDS && signedByActiveSecret) {
    return;
  }

  try {
    await setSession(payload.user);
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
