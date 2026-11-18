import Constants from "expo-constants";
import { z } from "zod";

const extraSchema = z.object({
  eas: z.object({ projectId: z.string().min(1) }),
});

const parsed = extraSchema.safeParse(Constants.expoConfig?.extra ?? {});

if (!parsed.success && __DEV__) {
  console.error("[app-config] Invalid `extra` in app.config.ts", z.prettifyError(parsed.error));
}

export const appConfig = {
  /** What Expo's push service attributes this build's tokens to. */
  easProjectId: parsed.success ? parsed.data.eas.projectId : undefined,
};
