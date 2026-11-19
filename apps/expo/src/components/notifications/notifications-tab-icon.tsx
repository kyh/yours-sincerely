import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ZoomIn, ZoomOut } from "react-native-reanimated";

import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { orpc } from "@/lib/api";
import { AnimatedView } from "@/lib/css-interop";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

const UNREAD_POLL_INTERVAL_MS = 60_000;

const UnreadDot = () => {
  const reduceMotionEnabled = useReducedMotion();

  const { data } = useQuery(
    orpc.notification.unreadCount.queryOptions({
      refetchInterval: UNREAD_POLL_INTERVAL_MS,
      refetchOnWindowFocus: "always",
    }),
  );

  if (data === undefined || data.count === 0) {
    return null;
  }

  return (
    <AnimatedView
      entering={reduceMotionEnabled ? undefined : ZoomIn.duration(180)}
      exiting={reduceMotionEnabled ? undefined : ZoomOut.duration(150)}
      className="bg-destructive absolute -top-0.5 -right-0.5 size-1.5 rounded-full"
    />
  );
};

interface Props {
  focused: boolean;
}

export const NotificationsTabIcon = ({ focused }: Props) => {
  const { user } = useWorkspaceUser();

  return (
    <View>
      <LottieTabIcon name="bell" focused={focused} />
      {user === null ? null : <UnreadDot />}
    </View>
  );
};
