import cookieSignature from "cookie-signature";
import { z } from "zod";

const PUSH_CLEANUP_SCOPE = "push-cleanup";

const capabilityPayloadSchema = z.object({
  scope: z.literal(PUSH_CLEANUP_SCOPE),
  userId: z.string(),
  // MIGRATION WINDOW: capabilities minted before expiry existed have no
  // `exp`, and the Expo app keeps one in SecureStore precisely so it can
  // clean up its push device AFTER signing out — the one moment it cannot
  // re-mint. Rejecting `exp`-less tokens would strand those devices, so
  // they are still accepted. Once the fleet has cycled (every signed-in
  // `auth.workspace` query re-mints), tighten this to require `exp`.
  exp: z.number().nullable().catch(null),
});

/**
 * 30 days. A capability is a narrow, single-purpose bearer token — NOT a
 * session. Sessions never expire (a deliberate product decision); capabilities
 * do, because a signed-in client re-mints one on every `auth.workspace` query.
 */
export const PUSH_CLEANUP_TTL_SECONDS = 60 * 60 * 24 * 30;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

export const signPushCleanupCapability = (
  userId: string,
  signingSecret: string,
  nowSeconds: number = nowInSeconds(),
) => {
  const payload = Buffer.from(
    JSON.stringify({
      scope: PUSH_CLEANUP_SCOPE,
      userId,
      exp: nowSeconds + PUSH_CLEANUP_TTL_SECONDS,
    }),
  ).toString("base64url");
  return cookieSignature.sign(payload, signingSecret);
};

export const parsePushCleanupCapability = (
  capability: string,
  signingSecrets: readonly string[],
  nowSeconds: number = nowInSeconds(),
) => {
  for (const secret of signingSecrets) {
    const unsigned = cookieSignature.unsign(capability, secret);
    if (!unsigned) continue;

    try {
      const parsed = capabilityPayloadSchema.safeParse(
        JSON.parse(Buffer.from(unsigned, "base64url").toString("utf8")),
      );
      if (parsed.success) {
        const { userId, exp } = parsed.data;
        if (exp !== null && exp <= nowSeconds) {
          return null;
        }
        return userId;
      }
    } catch {
      // A malformed payload must not abort verification against the remaining
      // secrets.
      continue;
    }
  }
  return null;
};
