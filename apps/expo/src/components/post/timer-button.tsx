import { useRef, useState } from "react";
import { Modal, Pressable, useWindowDimensions, View } from "react-native";
import { getExpiryProgress } from "@repo/contracts/content";
import { formatDistance } from "date-fns";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { FeedPost } from "@/lib/post-types";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { sectorPath } from "@/lib/timer-geometry";

const SIZE = 16;
const RADIUS = SIZE / 2;

interface Props {
  post: FeedPost;
}

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ExpiryTooltip = ({
  anchor,
  text,
  onClose,
}: {
  anchor: Anchor;
  text: string;
  onClose: () => void;
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [size, setSize] = useState({ height: 0, width: 0 });
  const left = Math.max(
    8,
    Math.min(anchor.x + anchor.width / 2 - size.width / 2, width - size.width - 8),
  );
  const above = anchor.y - size.height - 4 >= insets.top;
  const top = above ? anchor.y - size.height - 4 : anchor.y + anchor.height + 4;

  return (
    <Modal transparent statusBarTranslucent visible onRequestClose={onClose}>
      <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close expiry tooltip"
          className="absolute inset-0"
          onPress={onClose}
        />
        <View
          accessible
          accessibilityLabel={text}
          accessibilityLiveRegion="polite"
          className="rounded-md px-3 py-1.5"
          onLayout={(event) => setSize(event.nativeEvent.layout)}
          style={{
            backgroundColor: colors.foreground,
            left,
            maxWidth: Math.min(320, width - 16),
            opacity: size.width === 0 ? 0 : 1,
            position: "absolute",
            top,
          }}
        >
          <View
            style={{
              backgroundColor: colors.foreground,
              borderRadius: 2,
              height: 10,
              left: Math.max(8, Math.min(anchor.x + anchor.width / 2 - left - 5, size.width - 18)),
              position: "absolute",
              top: above ? size.height - 5 : -5,
              transform: [{ rotate: "45deg" }],
              width: 10,
            }}
          />
          <Text className="text-xs" style={{ color: colors.background }}>
            {text}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export const TimerButton = ({ post }: Props) => {
  const button = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const { percentage, end, isExpired } = getExpiryProgress(post.createdAt);
  const formattedTime = isExpired ? "Expired" : `Disappears in ${formatDistance(new Date(), end)}`;

  return (
    <>
      <Pressable
        ref={button}
        accessibilityRole="button"
        accessibilityLabel={formattedTime}
        hitSlop={6}
        className="size-8 items-center justify-center rounded-lg active:bg-accent"
        onLayout={() => setAnchor(null)}
        onPress={() =>
          button.current?.measureInWindow((x, y, width, height) =>
            setAnchor({ height, width, x, y }),
          )
        }
      >
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {percentage === 0 || percentage >= 100 ? (
            <Circle
              cx={RADIUS}
              cy={RADIUS}
              r={RADIUS}
              fill={percentage === 0 ? "rgba(120, 120, 120, 0.5)" : "rgba(120, 120, 120, 0.1)"}
            />
          ) : (
            <>
              <Path d={sectorPath(percentage, RADIUS)} fill="rgba(120, 120, 120, 0.1)" />
              <Path
                d={sectorPath(100 - percentage, RADIUS)}
                transform={`rotate(${percentage * 3.6} ${RADIUS} ${RADIUS})`}
                fill="rgba(120, 120, 120, 0.5)"
              />
            </>
          )}
        </Svg>
      </Pressable>
      {anchor !== null && (
        <ExpiryTooltip anchor={anchor} text={formattedTime} onClose={() => setAnchor(null)} />
      )}
    </>
  );
};
