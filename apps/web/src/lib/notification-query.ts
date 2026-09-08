import type { RouterOutputs } from "@repo/api";

type NotificationCursor = RouterOutputs["notification"]["list"]["nextCursor"];

/**
 * Arguments for `notification.list.infiniteOptions`, shared by the RSC prefetch
 * and the client hook — the same key-identity contract as `feedInfiniteArgs`.
 */
export const notificationInfiniteArgs = () => ({
  getNextPageParam: (lastPage: RouterOutputs["notification"]["list"]) => lastPage.nextCursor,
  initialPageParam: undefined,
  input: (cursor: NotificationCursor) => ({ cursor }),
});
