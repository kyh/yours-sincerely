import { Pressable } from "react-native";
import { getExpiryProgress } from "@repo/contracts/content";
import { formatDistance } from "date-fns";
import Svg, { Circle, Path } from "react-native-svg";
import { toast } from "sonner-native";

import type { FeedPost } from "@/lib/post-types";
import { sectorPath } from "@/lib/timer-geometry";

const SIZE = 16;
const RADIUS = SIZE / 2;

type Props = {
  post: FeedPost;
};

export const TimerButton = ({ post }: Props) => {
  const { percentage, end, isExpired } = getExpiryProgress(post.createdAt);
  const formattedTime = isExpired ? "Expired" : `Disappears in ${formatDistance(new Date(), end)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formattedTime}
      hitSlop={6}
      className="size-8 items-center justify-center rounded-lg active:bg-accent"
      onPress={() => toast(formattedTime)}
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="rgba(120, 120, 120, 0.5)" />
        {percentage >= 100 ? (
          <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="rgba(120, 120, 120, 0.1)" />
        ) : (
          <Path d={sectorPath(percentage, RADIUS)} fill="rgba(120, 120, 120, 0.1)" />
        )}
      </Svg>
    </Pressable>
  );
};
