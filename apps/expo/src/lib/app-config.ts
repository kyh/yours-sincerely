import Constants from "expo-constants";
import { z } from "zod";

/** Typed access to the `extra` values defined in app.config.ts. */
const extraSchema = z.object({
  eas: z.object({ projectId: z.string().min(1) }),
});

const parsed = extraSchema.safeParse(Constants.expoConfig?.extra ?? {});

// Without the project id `getExpoPushTokenAsync` rejects with a message that
// points nowhere near app.config.ts.
if (!parsed.success && __DEV__) {
  console.error("[app-config] Invalid `extra` in app.config.ts", z.prettifyError(parsed.error));
}

export const appConfig = {
  /** What Expo's push service attributes this build's tokens to. */
  easProjectId: parsed.success ? parsed.data.eas.projectId : undefined,
};
