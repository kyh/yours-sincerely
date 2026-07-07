import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import type { FeedPost } from "@/lib/post-types";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useThemeColors } from "@/components/theme-colors";
import { trpc } from "@/lib/api";

/** Port of apps/web posts/_components/like-button.tsx — heart pop, expanding
    ring, and 14-particle burst with the same timings/easings/colors. */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HEART_PATH =
  "m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z";

const Heart = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill={color} stroke={color}>
    <Path d={HEART_PATH} />
  </Svg>
);

const CIRCLE_RADIUS = 20;

/** Expanding ring: scale 0→1, stroke #E5214A→#CC8EF5, strokeWidth 40→0,
    400ms cubic-out. */
const CircleAnimation = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.33, 1, 0.68, 1) });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.value, [0, 1], ["#E5214A", "#CC8EF5"]),
    strokeWidth: (1 - progress.value) * CIRCLE_RADIUS * 2,
  }));

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", top: -12, left: -12 }, style]}
    >
      <Svg width={CIRCLE_RADIUS * 2} height={CIRCLE_RADIUS * 2}>
        <AnimatedCircle
          cx={CIRCLE_RADIUS}
          cy={CIRCLE_RADIUS}
          r={CIRCLE_RADIUS - 2}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
};

const colorPairs = [
  { from: "#9EC9F5", to: "#9ED8C6" },
  { from: "#91D3F7", to: "#9AE4CF" },
  { from: "#DC93CF", to: "#E3D36B" },
  { from: "#CF8EEF", to: "#CBEB98" },
  { from: "#87E9C6", to: "#1FCC93" },
  { from: "#A7ECD0", to: "#9AE4CF" },
  { from: "#87E9C6", to: "#A635D9" },
  { from: "#D58EB3", to: "#E0B6F5" },
  { from: "#F48BA2", to: "#CF8EEF" },
  { from: "#91D3F7", to: "#A635D9" },
  { from: "#CF8EEF", to: "#CBEB98" },
  { from: "#87E9C6", to: "#A635D9" },
  { from: "#9EC9F5", to: "#9ED8C6" },
  { from: "#91D3F7", to: "#9AE4CF" },
];

const BURST_RADIUS = 32;
const START_RADIUS = 4;
const PATH_SCALE_FACTOR = 0.8;

const Particle = ({
  fromColor,
  toColor,
  index,
  totalParticles,
}: {
  fromColor: string;
  toColor: string;
  index: number;
  totalParticles: number;
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const [config] = useState(() => {
    const angle = (index / totalParticles) * 360 + 45;
    const radians = (angle * Math.PI) / 180;
    const randomFactor = 0.85 + Math.random() * 0.3;
    const burstDistance = BURST_RADIUS * randomFactor;
    const duration = 500 + Math.random() * 200;
    const degreeShift = (13 * Math.PI) / 180;
    return {
      duration,
      startX: Math.cos(radians) * START_RADIUS * PATH_SCALE_FACTOR,
      startY: Math.sin(radians) * START_RADIUS * PATH_SCALE_FACTOR,
      targetX: Math.cos(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
      targetY: Math.sin(radians + degreeShift) * burstDistance * PATH_SCALE_FACTOR,
    };
  });

  useEffect(() => {
    // Movement/scale/color start at +300ms; opacity keyframes [0,1,1,0] at +400ms.
    progress.value = withDelay(
      300,
      withTiming(1, { duration: config.duration, easing: Easing.bezier(0.23, 1, 0.32, 1) }),
    );
    opacity.value = withDelay(
      400,
      withSequence(
        withTiming(1, { duration: config.duration * 0.01 }),
        withTiming(1, { duration: config.duration * 0.98 }),
        withTiming(0, { duration: config.duration * 0.01 }),
      ),
    );
  }, [progress, opacity, config]);

  const style = useAnimatedStyle(() => {
    // Scale uses quad-in on the same 0→1 clock as the (quint-out) movement:
    // recover linear time from the movement curve, then apply quad-in.
    const easedOutT = progress.value;
    const scale = 1 - Easing.bezier(0.55, 0.085, 0.68, 0.53).factory()(easedOutT);
    return {
      opacity: opacity.value,
      backgroundColor: interpolateColor(easedOutT, [0, 1], [fromColor, toColor]),
      transform: [
        { translateX: config.startX + (config.targetX - config.startX) * easedOutT },
        { translateY: config.startY + (config.targetY - config.startY) * easedOutT },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        style,
      ]}
    />
  );
};

const BurstAnimation = () => (
  <View
    pointerEvents="none"
    style={{
      position: "absolute",
      top: -12,
      left: -12,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {colorPairs.map((colors, index) => (
      <Particle
        key={index}
        fromColor={colors.from}
        toColor={colors.to}
        index={index}
        totalParticles={colorPairs.length}
      />
    ))}
  </View>
);

/** Heart pops in with spring {stiffness: 300, damping: 10} after 300ms. */
const AnimatingHeart = ({ onComplete }: { onComplete: () => void }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      300,
      withSpring(1, { stiffness: 300, damping: 10 }, (finished) => {
        if (finished === true) runOnJS(onComplete)();
      }),
    );
  }, [scale, onComplete]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Heart color="#ef4444" />
    </Animated.View>
  );
};

type Props = {
  post: FeedPost;
};

export const LikeButton = ({ post }: Props) => {
  const colors = useThemeColors();
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isAnimating, setIsAnimating] = useState(false);

  const createMutate = useMutation(trpc.like.createLike.mutationOptions());
  const deleteMutate = useMutation(trpc.like.deleteLike.mutationOptions());

  const toggleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
      deleteMutate.mutate({ postId: post.id });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      setLikeCount(likeCount + 1);
      setIsLiked(true);
      setIsAnimating(true);
      createMutate.mutate({ postId: post.id });
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${likeCount} likes, tap to ${isLiked ? "unlike" : "like"}`}
      className="active:bg-accent h-8 flex-row items-center gap-1.5 rounded-lg px-2"
      onPress={toggleLike}
    >
      <View>
        {isAnimating && <CircleAnimation />}
        {isAnimating && <BurstAnimation />}
        {isAnimating ? (
          <AnimatingHeart onComplete={() => setIsAnimating(false)} />
        ) : (
          <Heart color={isLiked ? "#ef4444" : colors.mutedForeground} />
        )}
      </View>
      <AnimatedNumber value={likeCount} />
    </Pressable>
  );
};
