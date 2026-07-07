import Constants from "expo-constants";
import { z } from "zod";

/** Typed access to the `extra` values defined in app.config.ts. */
const extraSchema = z.object({
  knockPublicApiKey: z.string().optional(),
  knockFeedChannelId: z.string().optional(),
  knockExpoChannelId: z.string().optional(),
});

const parsed = extraSchema.safeParse(Constants.expoConfig?.extra ?? {});

export const appConfig = parsed.success ? parsed.data : {};
