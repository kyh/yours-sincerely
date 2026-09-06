import type { Href } from "expo-router";
import type { NotificationTargetData } from "@repo/contracts/notifications";

/** Typed route for a parsed notification payload — shared by the in-app
    feed rows and native push responses so both open the same screen. */
export const resolveNotificationTarget = ({ parentPostId }: NotificationTargetData): Href => ({
  pathname: "/posts/[post-id]",
  params: { "post-id": parentPostId },
});
