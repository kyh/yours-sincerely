import { useEffect } from "react";
import { View } from "react-native";
import { useKnockFeed } from "@knocklabs/react-native";
import { ZoomIn, ZoomOut } from "react-native-reanimated";

import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { appConfig } from "@/lib/app-config";
import { AnimatedView } from "@/lib/css-interop";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Bell tab icon with an unread dot — mirrors the web sidebar badge. */
const UnreadDot = () => {
  const reduceMotionEnabled = useReducedMotion();
  const { feedClient, useFeedStore } = useKnockFeed();
  const unreadCount = useFeedStore((state) => state.metadata.unread_count);

  useEffect(() => {
    feedClient.fetch().catch(() => undefined);
  }, [feedClient]);

  if (unreadCount === 0) return null;

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
  const apiKey = appConfig.knockPublicApiKey;
  const feedId = appConfig.knockFeedChannelId;

  return (
    <View>
      <LottieTabIcon name="bell" focused={focused} />
      {user !== null && apiKey !== undefined && feedId !== undefined ? <UnreadDot /> : null}
    </View>
  );
};
