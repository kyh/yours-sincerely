import { WEB_ORIGIN } from "@repo/contracts/site";
import { z } from "zod";

/**
 * App configuration, parsed once at boot.
 *
 * Every key is optional on purpose: a missing one disables its feature
 * (password-reset email) or falls back to production's value instead of
 * crashing the server. And `.env.example` ships them as empty strings, so `""`
 * is normalised to `undefined` here rather than being re-checked —
 * inconsistently — at each call site.
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

export const envSchema = z.object({
  RESEND_API_KEY: optionalSetting,
  // The origin emailed links point at. Set it on preview and local deployments
  // that send email, or their links open production. A malformed value falls
  // back to production instead of failing: this module loads with every route,
  // so a typo here must never take the whole app down. The name is new on
  // purpose — an old `APP_URL` may still sit unread in a hosting dashboard.
  RESET_LINK_ORIGIN: optionalSetting
    .transform((value) => value ?? WEB_ORIGIN)
    .pipe(z.url())
    // oxlint-disable-next-line promise/prefer-await-to-then -- zod fallback, not a Promise
    .catch(WEB_ORIGIN),
});

// Listed key by key rather than handing over `process.env`: bundlers inline
// `process.env.NEXT_PUBLIC_*` as string literals and do not guarantee that the
// whole object survives the build.
export const env = envSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESET_LINK_ORIGIN: process.env.RESET_LINK_ORIGIN,
});
