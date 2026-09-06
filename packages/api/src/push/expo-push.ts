import { and, eq, lt } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { pushToken } from "@repo/db/drizzle-schema";
import { Expo } from "expo-server-sdk";

import { getPushTokenIdleCutoff, type PushMessage, sendPushToUserCore } from "./expo-push-core";

// No access token: Expo's push service accepts unauthenticated sends, and the
// device tokens are the only credential this side holds.
const expo = new Expo();

/** The user's tokens still worth sending to. Rows idle past the cut-off are
    deleted on the way, so a dead device stops costing a send the first time it
    would have been paid for. */
export const findLivePushTokens = async (userId: string): Promise<string[]> => {
  await db
    .delete(pushToken)
    .where(and(eq(pushToken.userId, userId), lt(pushToken.lastSeenAt, getPushTokenIdleCutoff())));

  const rows = await db
    .select({ token: pushToken.token })
    .from(pushToken)
    .where(eq(pushToken.userId, userId));
  return rows.map((row) => row.token);
};

/** Best-effort, never throws. See `sendPushToUserCore`. */
export const sendPushToUser = (message: PushMessage) =>
  sendPushToUserCore(message, {
    findTokens: findLivePushTokens,
    deleteToken: async (token) => {
      await db.delete(pushToken).where(eq(pushToken.token, token));
    },
    isExpoPushToken: (token) => Expo.isExpoPushToken(token),
    sendChunk: (messages) => expo.sendPushNotificationsAsync(messages),
    chunkSize: Expo.pushNotificationChunkSizeLimit,
    logError: (message) => console.error(message),
  });
