import { WEB_ORIGIN } from "@repo/contract/site/site";
import { z } from "zod";

// WARNING: COOKIE_SECRET stays out of here: auth/session-core.ts parses it failing closed, and an optional copy would be an authentication bypass.
const optionalSetting = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const envSchema = z.object({
  RESEND_API_KEY: optionalSetting,
  RESET_LINK_ORIGIN: optionalSetting
    .transform((value) => value ?? WEB_ORIGIN)
    .pipe(z.url())
    .catch(WEB_ORIGIN),
});

export const env = envSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESET_LINK_ORIGIN: process.env.RESET_LINK_ORIGIN,
});
