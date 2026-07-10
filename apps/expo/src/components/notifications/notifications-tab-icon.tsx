import { useEffect } from "react";
import { View } from "react-native";
import {
  useAuthenticatedKnockClient,
  useNotifications,
  useNotificationStore,
} from "@knocklabs/react-native";
import { ZoomIn, ZoomOut } from "react-native-reanimated";

import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { appConfig } from "@/lib/app-config";
import { AnimatedView } from "@/lib/css-interop";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Bell tab icon with an unread dot — mirrors the web sidebar badge. */
const UnreadDot = ({
  apiKey,
  feedId,
  userId,
}: {
  apiKey: string;
  feedId: string;
  userId: string;
}) => {
  const knock = useAuthenticatedKnockClient(apiKey, { id: userId });
  const notificationFeed = useNotifications(knock, feedId);
  const { metadata } = useNotificationStore(notificationFeed);

  useEffect(() => {
    notificationFeed.fetch().catch(() => undefined);
  }, [notificationFeed]);

  if ((metadata?.unread_count ?? 0) === 0) return null;

  // Mirrors the web badge's `animate-in fade-in zoom-in`: scale + fade in on
  // 0→n, matching scale + fade out on n→0.
  return (
    <AnimatedView
      entering={ZoomIn.duration(180)}
      exiting={ZoomOut.duration(150)}
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
      {user !== null && apiKey !== undefined && feedId !== undefined ? (
        <UnreadDot apiKey={apiKey} feedId={feedId} userId={user.id} />
      ) : null}
    </View>
  );
};
