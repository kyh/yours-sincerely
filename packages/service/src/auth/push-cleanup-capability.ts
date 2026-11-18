import cookieSignature from "cookie-signature";
import { z } from "zod";

const PUSH_CLEANUP_SCOPE = "push-cleanup";

const capabilityPayloadSchema = z.object({
  // WARNING: exp-less capabilities stay accepted until the fleet has cycled; rejecting them strands signed-out devices' push cleanup.
  exp: z.number().nullable().catch(null),
  scope: z.literal(PUSH_CLEANUP_SCOPE),
  userId: z.string(),
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
      exp: nowSeconds + PUSH_CLEANUP_TTL_SECONDS,
      scope: PUSH_CLEANUP_SCOPE,
      userId,
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

    if (!unsigned) {
      continue;
    }

    try {
      const parsed = capabilityPayloadSchema.safeParse(
        JSON.parse(Buffer.from(unsigned, "base64url").toString("utf-8")),
      );

      if (parsed.success) {
        const { userId, exp } = parsed.data;

        if (exp !== null && exp <= nowSeconds) {
          return null;
        }

        return userId;
      }
    } catch {
      continue;
    }
  }

  return null;
};
