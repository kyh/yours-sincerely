import { z } from "zod";

/**
 * App configuration, parsed once at boot.
 *
 * Every key is optional on purpose: a missing one disables its feature
 * (notifications, password-reset email) instead of crashing the server. And
 * `.env.example` ships them as empty strings, so `""` is normalised to
 * `undefined` here rather than being re-checked — inconsistently — at each call
 * site. `NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID` used to be guarded with a bare
 * `=== undefined`, which let an empty value through to Knock.
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
  KNOCK_API_KEY: optionalSetting,
  KNOCK_SIGNING_KEY: optionalSetting,
  NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID: optionalSetting,
  RESEND_API_KEY: optionalSetting,
});

// Listed key by key rather than handing over `process.env`: bundlers inline
// `process.env.NEXT_PUBLIC_*` as string literals and do not guarantee that the
// whole object survives the build.
export const env = envSchema.parse({
  KNOCK_API_KEY: process.env.KNOCK_API_KEY,
  KNOCK_SIGNING_KEY: process.env.KNOCK_SIGNING_KEY,
  NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID: process.env.NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});
