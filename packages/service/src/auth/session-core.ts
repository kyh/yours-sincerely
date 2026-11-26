import { hkdfSync } from "node:crypto";
import { BROWSER_COOKIE_MAX_AGE_SECONDS } from "@repo/contract/auth/auth-schema";
import cookieSignature from "cookie-signature";
import { z } from "zod";

/**
 * `iat` is absent on pre-sliding-renewal cookies; `epoch` is absent on every
 * cookie minted before session revocation existed. Both are in the wild.
 */
export interface SessionPayload {
  user: string;
  iat: number | null;
  epoch: number;
}

/** Cookies minted before the `sessionEpoch` column existed carry no epoch. */
export const LEGACY_SESSION_EPOCH = 0;

export const DEV_SIGNING_SECRET = "dev-insecure-signing-secret";
export const MIN_SECRET_LENGTH = 32;

export interface SecretEnv {
  COOKIE_SECRET?: string | undefined;
  COOKIE_SECRET_LEGACY?: string | undefined;
  NODE_ENV?: string | undefined;
}

/** Only an explicitly local environment may fall back to the public dev constant. */
export const isLocalEnv = (nodeEnv: string | undefined) =>
  nodeEnv === "development" || nodeEnv === "test";

/**
 * Fail CLOSED. Anything that is not explicitly `development`/`test` — a preview
 * deploy, a staging box, an unset NODE_ENV, a typo — must supply a real secret.
 * The session cookie *is* the user id, so signing real sessions with a constant
 * that is public in this repository would be an authentication bypass.
 */
export const resolveCookieSecret = (env: SecretEnv) => {
  const configured = env.COOKIE_SECRET;

  if (configured === undefined || configured.length === 0) {
    if (!isLocalEnv(env.NODE_ENV)) {
      throw new Error(
        "COOKIE_SECRET must be set (only NODE_ENV=development|test may use the dev fallback)",
      );
    }

    return DEV_SIGNING_SECRET;
  }

  if (configured.length < MIN_SECRET_LENGTH) {
    throw new Error(`COOKIE_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }

  return configured;
};

/**
 * Attributes for the session cookie.
 *
 * `sameSite: "lax"` is half the cross-site defense for `/api/orpc`: the RPC
 * handler carries no CSRF token, so a forged cross-SITE POST is harmless only
 * because the browser withholds this cookie from it. Widening it to `"none"`
 * silently un-guards every mutation — `security-contracts.test.ts` pins it.
 * `SameSite` keys on site, not origin, so it withholds nothing from a same-site
 * cross-ORIGIN page; the route's own origin check covers that half.
 *
 * `secure` follows the environment: every non-local deployment is HTTPS, and a
 * session cookie sent in the clear is interceptable — the cookie IS the identity.
 */
export const sessionCookieOptions = (isLocal: boolean) =>
  ({
    httpOnly: true,
    // WARNING: the browser's ceiling, not a session lifetime: sessions never expire (CLAUDE.md).
    maxAge: BROWSER_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: !isLocal,
  }) as const;

/** The two things the root secret is allowed to sign. Keys never cross purposes. */
export const SESSION_PURPOSE = "session";
export const PUSH_CLEANUP_PURPOSE = "push-cleanup";

/** HKDF sub-key, so a session signature and a capability signature are unrelated. */
export const deriveKey = (secret: string, purpose: string) =>
  Buffer.from(hkdfSync("sha256", secret, "", purpose, 32)).toString("base64url");

/**
 * Verification order: the derived key for this purpose first, then the RAW
 * secret, then every legacy secret in both forms.
 *
 * The raw secrets stay in the list PERMANENTLY on purpose. Tokens already in the
 * wild (browser cookies, the Expo app's SecureStore, migrated Capacitor cookies)
 * were signed with the raw secret before key derivation existed. Dropping them
 * from the verify list is a mass logout. Sliding renewal re-issues cookies with
 * the derived key, so the population migrates on its own.
 */
export const buildVerifySecrets = ({
  activeSecret,
  legacySecrets,
  purpose,
}: {
  activeSecret: string;
  legacySecrets: readonly string[];
  purpose: string;
}) => [
  deriveKey(activeSecret, purpose),
  activeSecret,
  ...legacySecrets.flatMap((secret) => [deriveKey(secret, purpose), secret]),
];

/** Unsign against each secret in order (active first, then legacy). */
export const unsignSession = (value: string, verifySecrets: readonly string[]) => {
  for (const secret of verifySecrets) {
    const unsigned = cookieSignature.unsign(value, secret);

    if (unsigned !== false) {
      return unsigned;
    }
  }

  return null;
};

const sessionPayloadSchema = z.object({
  // WARNING: a missing epoch must read as 0; rejecting it logs out every cookie minted before revocation existed.
  epoch: z.number().catch(LEGACY_SESSION_EPOCH),
  iat: z.number().nullable().catch(null),
  user: z.string(),
});

/** Parses attacker-supplied bytes. Tolerates every payload variant ever issued. */
export const parseSessionPayload = (unsignedCookie: string) => {
  try {
    const parsed = sessionPayloadSchema.safeParse(JSON.parse(atob(unsignedCookie)));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const encodeSessionPayload = (
  userId: string,
  issuedAtSeconds: number,
  sessionEpoch: number,
) =>
  Buffer.from(JSON.stringify({ epoch: sessionEpoch, iat: issuedAtSeconds, user: userId })).toString(
    "base64",
  );

export const signSession = (payload: string, secret: string) =>
  cookieSignature.sign(payload, secret);

/** `COOKIE_SECRET_LEGACY` is a comma-separated list; blanks are dropped. */
export const parseLegacySecrets = (raw: string | undefined) =>
  (raw ?? "")
    .split(",")
    .map((secret) => secret.trim())
    .filter((secret) => secret.length > 0);

/**
 * Verify a session cookie value and resolve it to a user, rejecting sessions
 * whose epoch is stale (i.e. revoked by a password reset or a
 * "sign out everywhere").
 *
 * This is the ONE gate. `session.ts` binds it to the cookie store for
 * production; `session-revocation.integration.ts` binds it to the real database
 * directly. Neither can drift from the other.
 *
 * Costs zero extra queries: `findUser` is the lookup the request context
 * already performs.
 */
export const resolveSessionUser = async <TUser extends { sessionEpoch: number }>({
  sessionValue,
  verifySecrets,
  findUser,
}: {
  sessionValue: string | null | undefined;
  verifySecrets: readonly string[];
  findUser: (userId: string) => Promise<TUser | null>;
}) => {
  if (sessionValue === undefined || sessionValue === null || sessionValue === "") {
    return null;
  }

  const unsigned = unsignSession(sessionValue, verifySecrets);

  if (unsigned === null) {
    return null;
  }

  const payload = parseSessionPayload(unsigned);

  if (payload === null) {
    return null;
  }

  const user = await findUser(payload.user);

  if (user === null) {
    return null;
  }

  return payload.epoch === user.sessionEpoch ? user : null;
};

export type RenewalDecision = "no-session" | "invalid" | "fresh" | "renew";

export interface RenewalOutcome {
  decision: RenewalDecision;
  payload: SessionPayload | null;
}

export interface RenewalInput {
  sessionValue: string | null | undefined;
  verifySecrets: readonly string[];
  activeSecret: string;
  nowSeconds: number;
  renewAfterSeconds: number;
}

/**
 * The branch the whole rotation promise rests on: a cookie that is still signed
 * by a legacy secret must be re-issued even when it is fresh, so active sessions
 * migrate onto the active signer after a rotation.
 */
export const decideRenewal: (input: RenewalInput) => RenewalOutcome = ({
  sessionValue,
  verifySecrets,
  activeSecret,
  nowSeconds,
  renewAfterSeconds,
}) => {
  if (sessionValue === undefined || sessionValue === null || sessionValue === "") {
    return { decision: "no-session", payload: null };
  }

  const unsigned = unsignSession(sessionValue, verifySecrets);

  if (unsigned === null) {
    return { decision: "invalid", payload: null };
  }

  const payload = parseSessionPayload(unsigned);

  if (payload === null) {
    return { decision: "invalid", payload: null };
  }

  const ageSeconds = nowSeconds - (payload.iat ?? 0);
  const signedByActiveSecret = cookieSignature.unsign(sessionValue, activeSecret) !== false;

  return ageSeconds < renewAfterSeconds && signedByActiveSecret
    ? { decision: "fresh", payload }
    : { decision: "renew", payload };
};
