import Constants from "expo-constants";
import { z } from "zod";

/** A blank value means "not configured" — same as the key being absent. */
const optionalConfigString = z
  .string()
  .transform((value) => (value.trim() === "" ? undefined : value))
  .optional();

/** Typed access to the `extra` values defined in app.config.ts. */
const extraSchema = z.object({
  knockPublicApiKey: optionalConfigString,
  knockFeedChannelId: optionalConfigString,
  knockExpoChannelId: optionalConfigString,
});

const parsed = extraSchema.safeParse(Constants.expoConfig?.extra ?? {});

export const appConfig = parsed.success ? parsed.data : {};
