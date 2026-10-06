import { z } from "zod";

import { serverTimestamp } from "../content.ts";

/** Push payload. The API sends it and every client routes a tapped
    notification by it, so a renamed key here silently breaks deep-opening
    the letter. */
export const newCommentNotificationData = z.object({
  commentPostId: z.string().min(1),
  parentPostId: z.string().min(1),
});
export type NewCommentNotificationData = z.infer<typeof newCommentNotificationData>;

/** What a client needs to open the right letter from a tapped notification.
    Parsed at the tap boundary; unknown extra keys are dropped. */
export const notificationTargetData = newCommentNotificationData.pick({ parentPostId: true });
export type NotificationTargetData = z.infer<typeof notificationTargetData>;

export const NOTIFICATION_KINDS = ["COMMENT"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Bounded like the feed: both clients page in small batches. */
export const NOTIFICATION_PAGE_SIZE = 20;

/** `unreadCount` stops counting here. Every client only asks whether it is zero,
    and a popular author's unread backlog would otherwise be recounted, row by
    row, on every poll. */
export const UNREAD_COUNT_CAP = 100;

export const listNotificationsInput = z.object({
  cursor: z
    .object({
      createdAt: serverTimestamp,
      notificationId: z.string().min(1),
    })
    .optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
export type ListNotificationsInput = z.infer<typeof listNotificationsInput>;

export const markNotificationsReadInput = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("all") }),
  z.object({ ids: z.array(z.string().min(1)).min(1).max(100), scope: z.literal("ids") }),
]);
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadInput>;

/** How many characters of the comment a notification row shows. */
export const NOTIFICATION_PREVIEW_MAX_CHARS = 140;

/** The one sentence both the in-app row and the push body use, so the two
    never describe the same event differently. */
export const describeNotification = (input: { kind: NotificationKind; actorName: string }) => {
  switch (input.kind) {
    case "COMMENT": {
      return `${input.actorName} replied to your letter`;
    }
    default: {
      const exhaustive: never = input.kind;
      throw new Error(`Unknown notification kind ${String(exhaustive)}`);
    }
  }
};
