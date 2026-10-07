import { type } from "@orpc/contract";

import { protectedBase } from "../base.ts";
import type { NotificationKind } from "./notification-schema.ts";
import { listNotificationsInput, markNotificationsReadInput } from "./notification-schema.ts";

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
  list: protectedBase.input(listNotificationsInput).output(
    type<{
      nextCursor: { createdAt: string; notificationId: string } | undefined;
      notifications: NotificationItem[];
    }>(),
  ),
  markRead: protectedBase.input(markNotificationsReadInput).output(type<{ updated: number }>()),
  unreadCount: protectedBase.output(type<{ count: number }>()),
};
