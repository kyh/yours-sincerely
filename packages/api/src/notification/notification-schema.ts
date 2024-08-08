import { z } from "zod";

export const createNotificationInput = z.object({
  userId: z.string(),
  body: z.string(),
  channel: z.enum(["in_app", "email"]).optional(),
  createdAt: z.string().optional(),
  dismissed: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  type: z.enum(["info", "warning", "error"]).optional(),
});

export const dismissNotificationInput = z.object({
  notification: z.number(),
});

export const fetchNotificationsInput = z.object({
  accountIds: z.array(z.string()),
});
