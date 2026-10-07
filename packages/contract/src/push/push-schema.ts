import { z } from "zod";

export const PUSH_PLATFORMS = ["ios", "android"] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

/** A device that has not launched the app in this long is treated as gone: its
    push token is deleted before the next push to its account. The API enforces it
    (`packages/service/src/push/expo-push-core.ts`) and the privacy policy states it,
    so both read this one value. */
export const PUSH_TOKEN_MAX_IDLE_DAYS = 90;

/** Expo issues `ExponentPushToken[…]` today and `ExpoPushToken[…]` historically;
    accepting only those shapes keeps arbitrary strings out of the table. */
export const expoPushToken = z
  .string()
  .regex(/^Expo(?<legacy>nent)?PushToken\[[A-Za-z0-9_-]+\]$/u, "Not an Expo push token");

export const registerPushTokenInput = z.object({
  platform: z.enum(PUSH_PLATFORMS),
  token: expoPushToken,
});
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenInput>;

/** Signed-out devices unregister with the capability minted while they were
    signed in; see packages/service/src/auth/push-cleanup-capability.ts. */
export const unregisterPushTokenInput = z.object({
  capability: z.string().min(1),
  token: expoPushToken,
});
export type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenInput>;
