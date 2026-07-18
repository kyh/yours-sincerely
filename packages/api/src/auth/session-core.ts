import { hkdfSync } from "node:crypto";
import cookieSignature from "cookie-signature";

/**
 * The pure half of session handling: everything that does NOT need
 * `next/headers`. Secrets, the environment and the clock arrive as parameters,
 * which is what makes this testable (see `session-core.test.ts` and
 * `session-secrets.test.ts`). `session.ts` is the thin cookie-store wiring over
 * these functions.
 */

/**
 * `iat` is absent on pre-sliding-renewal cookies; `epoch` is absent on every
 * cookie minted before session revocation existed. Both are in the wild.
 */
export type SessionPayload = { user: string; iat: number | null; epoch: number };

/** Cookies minted before the `sessionEpoch` column existed carry no epoch. */
export const LEGACY_SESSION_EPOCH = 0;

export const DEV_SIGNING_SECRET = "dev-insecure-signing-secret"; // local dev only
export const MIN_SECRET_LENGTH = 32;

export type SecretEnv = {
  COOKIE_SECRET?: string | undefined;
  COOKIE_SECRET_LEGACY?: string | undefined;
  NODE_ENV?: string | undefined;
};

/** Only an explicitly local environment may fall back to the public dev constant. */
export const isLocalEnv = (nodeEnv: string | undefined): boolean =>
  nodeEnv === "development" || nodeEnv === "test";

/**
 * Fail CLOSED. Anything that is not explicitly `development`/`test` — a preview
 * deploy, a staging box, an unset NODE_ENV, a typo — must supply a real secret.
 * The session cookie *is* the user id, so signing real sessions with a constant
 * that is public in this repository would be an authentication bypass.
 */
export const resolveCookieSecret = (env: SecretEnv): string => {
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

/** The two things the root secret is allowed to sign. Keys never cross purposes. */
export const SESSION_PURPOSE = "session";
export const PUSH_CLEANUP_PURPOSE = "push-cleanup";

/** HKDF sub-key, so a session signature and a capability signature are unrelated. */
export const deriveKey = (secret: string, purpose: string): string =>
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
}): string[] => [
  deriveKey(activeSecret, purpose),
  activeSecret,
  ...legacySecrets.flatMap((secret) => [deriveKey(secret, purpose), secret]),
];

/** Unsign against each secret in order (active first, then legacy). */
export const unsignSession = (value: string, verifySecrets: readonly string[]): string | null => {
  for (const secret of verifySecrets) {
    const unsigned = cookieSignature.unsign(value, secret);
    if (unsigned) {
      return unsigned;
    }
  }
  return null;
};

/** Parses attacker-supplied bytes. Tolerates every payload shape ever issued. */
export const parseSessionPayload = (unsignedCookie: string): SessionPayload | null => {
  try {
    const parsed: unknown = JSON.parse(atob(unsignedCookie));
    if (typeof parsed !== "object" || parsed === null || !("user" in parsed)) {
      return null;
    }
    const { user } = parsed;
    if (typeof user !== "string") {
      return null;
    }
    // Legacy payloads (pre sliding renewal) have no `iat`.
    const iat = "iat" in parsed && typeof parsed.iat === "number" ? parsed.iat : null;
    // Legacy payloads (pre revocation) have no `epoch`. The `User.sessionEpoch`
    // column defaults to 0, so reading a missing epoch as 0 keeps every cookie
    // already in the wild valid. THIS IS THE MASS-LOGOUT GUARD — do not tighten
    // it into a rejection.
    const epoch =
      "epoch" in parsed && typeof parsed.epoch === "number" ? parsed.epoch : LEGACY_SESSION_EPOCH;
    return { user, iat, epoch };
  } catch {
    return null;
  }
};

export const encodeSessionPayload = (
  userId: string,
  issuedAtSeconds: number,
  sessionEpoch: number,
): string =>
  Buffer.from(JSON.stringify({ user: userId, iat: issuedAtSeconds, epoch: sessionEpoch })).toString(
    "base64",
  );

export const signSession = (payload: string, secret: string): string =>
  cookieSignature.sign(payload, secret);

/** `COOKIE_SECRET_LEGACY` is a comma-separated list; blanks are dropped. */
export const parseLegacySecrets = (raw: string | undefined): string[] =>
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
}): Promise<TUser | null> => {
  if (!sessionValue) {
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

  // A stale epoch means this session was deliberately revoked. (Sessions still
  // never EXPIRE — nothing here consults the clock.)
  return payload.epoch === user.sessionEpoch ? user : null;
};

export type RenewalDecision = "no-session" | "invalid" | "fresh" | "renew";

export type RenewalInput = {
  sessionValue: string | null | undefined;
  verifySecrets: readonly string[];
  activeSecret: string;
  nowSeconds: number;
  renewAfterSeconds: number;
};

/**
 * The branch the whole rotation promise rests on: a cookie that is still signed
 * by a legacy secret must be re-issued even when it is fresh, so active sessions
 * migrate onto the active signer after a rotation.
 */
export const decideRenewal = ({
  sessionValue,
  verifySecrets,
  activeSecret,
  nowSeconds,
  renewAfterSeconds,
}: RenewalInput): { decision: RenewalDecision; payload: SessionPayload | null } => {
  if (!sessionValue) {
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

  // A legacy payload has no `iat`, so its age computes as `nowSeconds - 0` — an
  // enormous number that always renews. That is deliberate: it is how
  // pre-renewal cookies get upgraded.
  const ageSeconds = nowSeconds - (payload.iat ?? 0);
  const signedByActiveSecret = cookieSignature.unsign(sessionValue, activeSecret) !== false;

  return ageSeconds < renewAfterSeconds && signedByActiveSecret
    ? { decision: "fresh", payload }
    : { decision: "renew", payload };
};
