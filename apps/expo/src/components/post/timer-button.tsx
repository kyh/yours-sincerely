import { Pressable } from "react-native";
import { POST_EXPIRY_DAYS_AGO } from "@repo/api/post/post-utils";
import { addDays, formatDistance } from "date-fns";
import Svg, { Circle, Path } from "react-native-svg";
import { toast } from "sonner-native";

import type { FeedPost } from "@/lib/post-types";

/** Same countdown math as the web timer-button. */
const getPercentage = (createdAt: Date) => {
  const now = new Date();
  const start = createdAt;
  const end = addDays(createdAt, POST_EXPIRY_DAYS_AGO);
  return {
    now,
    start,
    end,
    percentage: Math.round(
      ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100,
    ),
  };
};

const SIZE = 16;
const RADIUS = SIZE / 2;

/** Sector path from 12 o'clock, sweeping `percentage` of the circle clockwise —
    the native equivalent of the web's conic-gradient pie. */
const sectorPath = (percentage: number) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const angle = (clamped / 100) * 360;
  const largeArc = angle > 180 ? 1 : 0;
  const radians = ((angle - 90) * Math.PI) / 180;
  const x = RADIUS + RADIUS * Math.cos(radians);
  const y = RADIUS + RADIUS * Math.sin(radians);
  return `M ${RADIUS} ${RADIUS} L ${RADIUS} 0 A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x} ${y} Z`;
};

type Props = {
  post: FeedPost;
};

export const TimerButton = ({ post }: Props) => {
  if (!post.createdAt) return null;

  const start = new Date(post.createdAt);
  const { percentage, now, end } = getPercentage(start);
  const formattedTime = formatDistance(now, end);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Content disappears in ${formattedTime}`}
      className="size-8 items-center justify-center rounded-lg active:bg-accent"
      onPress={() => toast(`Dissapears in ${formattedTime}`)}
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="rgba(120, 120, 120, 0.5)" />
        {percentage >= 100 ? (
          <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="rgba(120, 120, 120, 0.1)" />
        ) : (
          <Path d={sectorPath(percentage)} fill="rgba(120, 120, 120, 0.1)" />
        )}
      </Svg>
    </Pressable>
  );
};
