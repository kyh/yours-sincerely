import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ZoomIn, ZoomOut } from "react-native-reanimated";

import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { orpc } from "@/lib/api";
import { AnimatedView } from "@/lib/css-interop";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Foreground pushes and app-focus refetches cover the usual paths; polling
    only catches a reply that lands while the app sits open on another tab. */
const UNREAD_POLL_INTERVAL_MS = 60_000;

/** Bell tab icon with an unread dot — mirrors the web sidebar badge. */
const UnreadDot = () => {
  const reduceMotionEnabled = useReducedMotion();
  const { data } = useQuery(
    orpc.notification.unreadCount.queryOptions({ refetchInterval: UNREAD_POLL_INTERVAL_MS }),
  );

  if (data === undefined || data.count === 0) return null;

  // Mirrors the web badge's `animate-in fade-in zoom-in`: scale + fade in on
  // 0→n, matching scale + fade out on n→0.
  return (
    <AnimatedView
      entering={reduceMotionEnabled ? undefined : ZoomIn.duration(180)}
      exiting={reduceMotionEnabled ? undefined : ZoomOut.duration(150)}
      className="bg-destructive absolute -top-0.5 -right-0.5 size-2 rounded-full"
    />
  );
};

type Props = {
  focused: boolean;
};

export const NotificationsTabIcon = ({ focused }: Props) => {
  const { user } = useWorkspaceUser();

  return (
    <View>
      <LottieTabIcon name="bell" focused={focused} />
      {user !== null ? <UnreadDot /> : null}
    </View>
  );
};
