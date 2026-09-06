import type { NewCommentNotificationData } from "@repo/contracts/notifications";
import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

/**
 * The pure half of push delivery: Expo's client, the token store and the
 * logger arrive as parameters so `expo-push-core.test.ts` can drive every
 * ticket outcome without a network. `expo-push.ts` is the wiring.
 */

/** Every payload a push can carry, so a client parses a tapped notification
    back into one of the contracts shapes rather than a loose dictionary. */
export type PushData = NewCommentNotificationData;

export type PushMessage = {
  userId: string;
  title: string;
  body: string;
  data: PushData;
};

export type PushDependencies = {
  findTokens: (userId: string) => Promise<string[]>;
  deleteToken: (token: string) => Promise<void>;
  isExpoPushToken: (token: string) => boolean;
  sendChunk: (messages: ExpoPushMessage[]) => Promise<ExpoPushTicket[]>;
  /** Expo rejects a request carrying more messages than this. */
  chunkSize: number;
  logError: (message: string) => void;
};

export type PushOutcome = {
  sent: number;
  /** Tokens Expo reported as `DeviceNotRegistered`, now deleted. */
  pruned: string[];
  failed: number;
};

/** A token is a device credential; a log line must not carry it whole. */
export const redactPushToken = (token: string) => token.replace(/\[.*\]$/, "[…]");

/** A device that has not launched the app in this long is treated as gone.
    Expo reports an uninstalled device as `DeviceNotRegistered` only in the
    push receipts, which nothing here fetches, so without a cut-off a token
    would outlive its app forever and keep the sender throttled by APNs/FCM.
    `push.register` refreshes `lastSeenAt` on every launch, so a device that
    comes back re-registers itself. */
export const PUSH_TOKEN_MAX_IDLE_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The oldest `lastSeenAt` a token is still sent to, as a Postgres
    `timestamp`-comparable ISO string (the column is `mode: "string"`). */
export const getPushTokenIdleCutoff = (now: Date = new Date()): string =>
  new Date(now.getTime() - PUSH_TOKEN_MAX_IDLE_DAYS * DAY_MS).toISOString();

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

/**
 * Best-effort delivery to every device the user has registered. Never throws:
 * the write that triggered the push has already committed, and a delivery
 * problem must not turn into a failed request for the person who caused it.
 */
export const sendPushToUserCore = async (
  message: PushMessage,
  deps: PushDependencies,
): Promise<PushOutcome> => {
  const outcome: PushOutcome = { sent: 0, pruned: [], failed: 0 };

  try {
    const tokens = (await deps.findTokens(message.userId)).filter(deps.isExpoPushToken);

    for (const batch of chunk(tokens, deps.chunkSize)) {
      const messages = batch.map((to): ExpoPushMessage => ({
        to,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: "default",
      }));

      let tickets: ExpoPushTicket[];
      try {
        tickets = await deps.sendChunk(messages);
      } catch (error) {
        outcome.failed += batch.length;
        deps.logError(
          `push: send failed for ${batch.length} device(s): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        continue;
      }

      // Tickets are positional: the nth ticket answers the nth message.
      for (const [index, ticket] of tickets.entries()) {
        if (ticket.status === "ok") {
          outcome.sent += 1;
          continue;
        }

        const token = batch[index] ?? ticket.details?.expoPushToken;
        if (ticket.details?.error === "DeviceNotRegistered" && token !== undefined) {
          await deps.deleteToken(token);
          outcome.pruned.push(token);
          continue;
        }

        outcome.failed += 1;
        deps.logError(
          `push: ${ticket.details?.error ?? "error"} for ${
            token === undefined ? "unknown device" : redactPushToken(token)
          }: ${ticket.message}`,
        );
      }
    }
  } catch (error) {
    deps.logError(
      `push: aborted for user ${message.userId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return outcome;
};
