import { oc, type } from "@orpc/contract";

import type { NotificationKind } from "./notifications.ts";
import { listNotificationsInput, markNotificationsReadInput } from "./notifications.ts";

export interface NotificationItem {
  actorName: string;
  commentId: string;
  createdAt: string;
  id: string;
  kind: NotificationKind;
  postId: string;
  /** The comment, cut to `NOTIFICATION_PREVIEW_MAX_CHARS` code points. */
  preview: string;
  readAt: string | null;
}

export const notificationContract = {
  list: oc.input(listNotificationsInput).output(
    type<{
      nextCursor: { createdAt: string; notificationId: string } | undefined;
      notifications: NotificationItem[];
    }>(),
  ),
  markRead: oc.input(markNotificationsReadInput).output(type<{ updated: number }>()),
  unreadCount: oc.output(type<{ count: number }>()),
};
