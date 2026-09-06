import { z } from "zod";

/**
 * App configuration, parsed once at boot.
 *
 * Every key is optional on purpose: a missing one disables its feature
 * (password-reset email) instead of crashing the server. And `.env.example`
 * ships them as empty strings, so `""` is normalised to `undefined` here rather
 * than being re-checked — inconsistently — at each call site.
 *
 * Push needs no key: Expo's push service accepts unauthenticated sends, and the
 * device tokens live in the database (`push/expo-push.ts`).
 *
 * Deliberately NOT here:
 * - `COOKIE_SECRET` / `COOKIE_SECRET_LEGACY`. `auth/session-core.ts` parses
 *   those with a stricter, tested boundary that fails CLOSED outside
 *   development and test. A permissive `.optional()` copy would be an
 *   authentication bypass, not a convenience.
 * - Platform runtime vars (`NODE_ENV`, `VERCEL_*`, `PORT`) — those describe
 *   where the process runs, not how the app is configured.
 */
const optionalSetting = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const envSchema = z.object({
  RESEND_API_KEY: optionalSetting,
});

// Listed key by key rather than handing over `process.env`: bundlers inline
// `process.env.NEXT_PUBLIC_*` as string literals and do not guarantee that the
// whole object survives the build.
export const env = envSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});
