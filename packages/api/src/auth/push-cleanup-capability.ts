import cookieSignature from "cookie-signature";

const PUSH_CLEANUP_SCOPE = "push-cleanup";

export const signPushCleanupCapability = (userId: string, signingSecret: string) => {
  const payload = Buffer.from(JSON.stringify({ scope: PUSH_CLEANUP_SCOPE, userId })).toString(
    "base64url",
  );
  return cookieSignature.sign(payload, signingSecret);
};

export const parsePushCleanupCapability = (capability: string, signingSecrets: string[]) => {
  for (const secret of signingSecrets) {
    const unsigned = cookieSignature.unsign(capability, secret);
    if (!unsigned) continue;

    try {
      const parsed: unknown = JSON.parse(Buffer.from(unsigned, "base64url").toString("utf8"));
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "scope" in parsed &&
        parsed.scope === PUSH_CLEANUP_SCOPE &&
        "userId" in parsed &&
        typeof parsed.userId === "string"
      ) {
        return parsed.userId;
      }
    } catch {
      return null;
    }
  }
  return null;
};
