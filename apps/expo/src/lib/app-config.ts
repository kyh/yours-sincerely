import Constants from "expo-constants";
import { z } from "zod";

const optionalConfigString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

/** Typed access to the `extra` values defined in app.config.ts. */
const extraSchema = z.object({
  knockPublicApiKey: optionalConfigString,
  knockFeedChannelId: optionalConfigString,
  knockExpoChannelId: optionalConfigString,
  sentryDsn: optionalConfigString,
});

const parsed = extraSchema.safeParse(Constants.expoConfig?.extra ?? {});

export const appConfig = parsed.success ? parsed.data : {};
