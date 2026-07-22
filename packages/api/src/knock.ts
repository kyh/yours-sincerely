import { Knock, signUserToken } from "@knocklabs/node";

import { env } from "./env";

const KNOCK_TOKEN_EXPIRY_SECONDS = 60 * 60;
// Reuse window ends well before expiry so clients never get a stale token.
const KNOCK_TOKEN_REUSE_MS = (KNOCK_TOKEN_EXPIRY_SECONDS - 10 * 60) * 1000;
const TOKEN_CACHE_MAX_ENTRIES = 1000;

/** Null when Knock isn't configured — callers decide whether that's an error. */
export const getKnockClient = () => {
  const apiKey = env.KNOCK_API_KEY;
  if (apiKey === undefined) return null;
  return new Knock({ apiKey });
};

const tokenCache = new Map<string, { token: string; reuseUntil: number }>();

/** Memoized per user so repeated workspace fetches return a byte-identical
    token — Knock clients tear down and reconnect whenever the string changes. */
export const createKnockUserToken = async (userId: string) => {
  const signingKey = env.KNOCK_SIGNING_KEY;
  if (signingKey === undefined) return null;

  const cached = tokenCache.get(userId);
  if (cached !== undefined && Date.now() < cached.reuseUntil) return cached.token;

  const token = await signUserToken(userId, {
    signingKey,
    expiresInSeconds: KNOCK_TOKEN_EXPIRY_SECONDS,
  });
  if (tokenCache.size >= TOKEN_CACHE_MAX_ENTRIES) tokenCache.clear();
  tokenCache.set(userId, { token, reuseUntil: Date.now() + KNOCK_TOKEN_REUSE_MS });
  return token;
};
