import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { LIKE_BURST_COLOR_PAIRS } from "@repo/contracts/content";
import type { InfiniteData } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, {
  createAnimatedComponent,
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { toast } from "sonner-native";

import type { RouterOutputs } from "@/lib/api";
import type { FeedPost } from "@/lib/post-types";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useThemeColors } from "@/components/theme-colors";
import { queryClient, orpc } from "@/lib/api";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { createLikeMutationHandlers } from "@/lib/like-cache";
import { refreshPostContent, refreshWorkspaceIdentityIfAnonymous } from "@/lib/query-policies";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Port of apps/web posts/_components/like-button.tsx — heart pop, expanding
    ring, and 14-particle burst with the same timings/easings/colors. */

const AnimatedCircle = createAnimatedComponent(Circle);

const HEART_PATH =
  "m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z";

const HEART_COLOR = "#fb2c36";

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
    progress.set(withTiming(1, { duration: 400, easing: Easing.bezier(0.33, 1, 0.68, 1) }));
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    stroke: interpolateColor(progress.get(), [0, 1], ["#E5214A", "#CC8EF5"]),
    strokeWidth: (1 - progress.get()) * CIRCLE_RADIUS * 2,
  }));

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: progress.get() }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ left: -12, position: "absolute", top: -12 }, style]}
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

const BURST_RADIUS = 32;
const START_RADIUS = 4;
const PATH_SCALE_FACTOR = 0.8;

interface ParticleFlight {
  duration: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

const planParticleFlight = (index: number, totalParticles: number): ParticleFlight => {
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
};

type BurstPlan = { color: (typeof LIKE_BURST_COLOR_PAIRS)[number]; flight: ParticleFlight }[];

/** Rolled once per tap, in the handler: render must stay pure. */
const planBurst = (): BurstPlan =>
  LIKE_BURST_COLOR_PAIRS.map((color, index) => ({
    color,
    flight: planParticleFlight(index, LIKE_BURST_COLOR_PAIRS.length),
  }));

const Particle = ({
  fromColor,
  toColor,
  flight,
}: {
  fromColor: string;
  toColor: string;
  flight: ParticleFlight;
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Movement/scale/color start at +300ms; opacity keyframes [0,1,1,0] at +400ms.
    progress.set(
      withDelay(300, withTiming(1, { duration: flight.duration, easing: Easing.linear })),
    );
    opacity.set(
      withDelay(
        400,
        withSequence(
          withTiming(1, { duration: flight.duration * 0.01 }),
          withTiming(1, { duration: flight.duration * 0.98 }),
          withTiming(0, { duration: flight.duration * 0.01 }),
        ),
      ),
    );
  }, [progress, opacity, flight]);

  const style = useAnimatedStyle(() => {
    const t = progress.get();
    const easedOutT = Easing.bezier(0.23, 1, 0.32, 1).factory()(t);
    const colorT = Easing.bezier(0.42, 0, 0.58, 1).factory()(t);
    const scale = 1 - Easing.bezier(0.55, 0.085, 0.68, 0.53).factory()(t);
    return {
      backgroundColor: interpolateColor(colorT, [0, 1], [fromColor, toColor]),
      opacity: opacity.get(),
      transform: [
        { translateX: flight.startX + (flight.targetX - flight.startX) * easedOutT },
        { translateY: flight.startY + (flight.targetY - flight.startY) * easedOutT },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          borderRadius: 3,
          height: 6,
          position: "absolute",
          width: 6,
        },
        style,
      ]}
    />
  );
};

const BurstAnimation = ({ burst }: { burst: BurstPlan }) => (
  <View
    pointerEvents="none"
    style={{
      alignItems: "center",
      height: 40,
      justifyContent: "center",
      left: -12,
      position: "absolute",
      top: -12,
      width: 40,
    }}
  >
    {burst.map(({ color, flight }) => (
      <Particle key={color.id} fromColor={color.from} toColor={color.to} flight={flight} />
    ))}
  </View>
);

/** Heart pops in with spring {stiffness: 300, damping: 10} after 300ms. */
const AnimatingHeart = ({ onComplete }: { onComplete: () => void }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.set(
      withDelay(
        300,
        withSpring(1, { damping: 10, stiffness: 300 }, (finished) => {
          if (finished === true) {
            scheduleOnRN(onComplete);
          }
        }),
      ),
    );
  }, [scale, onComplete]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={style}>
      <Heart color={HEART_COLOR} />
    </Animated.View>
  );
};

interface Props {
  post: FeedPost;
}

type FeedQueryData = InfiniteData<RouterOutputs["post"]["getFeed"]>;
type PostQueryData = RouterOutputs["post"]["getPost"];

const FEED_FILTER = { queryKey: orpc.post.getFeed.key({ type: "infinite" }) };
const POST_FILTER = { queryKey: orpc.post.getPost.key() };

/** Binds the pure like bookkeeping to the real feed and post-detail caches. */
const likeMutationHandlers = (postId: string, liked: boolean) => {
  const handlers = createLikeMutationHandlers<FeedQueryData, PostQueryData>(
    {
      cancel: async () => {
        await Promise.all([
          queryClient.cancelQueries(FEED_FILTER),
          queryClient.cancelQueries(POST_FILTER),
        ]);
      },
      readFeeds: () => queryClient.getQueriesData<FeedQueryData>(FEED_FILTER),
      readPosts: () => queryClient.getQueriesData<PostQueryData>(POST_FILTER),
      refresh: () => {
        void ignoreRejection(refreshPostContent());
        void ignoreRejection(refreshWorkspaceIdentityIfAnonymous());
      },
      writeFeed: (queryKey, data) => queryClient.setQueryData(queryKey, data),
      writePost: (queryKey, data) => queryClient.setQueryData(queryKey, data),
    },
    postId,
    liked,
  );
  return {
    ...handlers,
    onError: (...args: Parameters<typeof handlers.onError>) => {
      handlers.onError(...args);
      toast.error("Could not update this like. Please try again.");
    },
  };
};

export const LikeButton = ({ post }: Props) => {
  const colors = useThemeColors();
  const reduceMotionEnabled = useReducedMotion();
  const [burst, setBurst] = useState<BurstPlan | null>(null);
  const activeBurst = reduceMotionEnabled ? null : burst;
  const finishBurst = useCallback(() => setBurst(null), []);

  const createMutate = useMutation(
    orpc.like.createLike.mutationOptions(likeMutationHandlers(post.id, true)),
  );
  const deleteMutate = useMutation(
    orpc.like.deleteLike.mutationOptions(likeMutationHandlers(post.id, false)),
  );
  const mutationPending = createMutate.isPending || deleteMutate.isPending;

  const toggleLike = () => {
    if (mutationPending) {
      return;
    }
    if (post.isLiked) {
      deleteMutate.mutate({ postId: post.id });
    } else {
      void ignoreRejection(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      setBurst(reduceMotionEnabled ? null : planBurst());
      createMutate.mutate({ postId: post.id });
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${post.likeCount} likes, tap to ${post.isLiked ? "unlike" : "like"}`}
      accessibilityState={{
        busy: mutationPending,
        disabled: mutationPending,
        selected: post.isLiked,
      }}
      disabled={mutationPending}
      hitSlop={6}
      className="active:bg-accent h-8 flex-row items-center gap-1.5 rounded-lg px-2"
      onPress={toggleLike}
    >
      <View>
        {activeBurst !== null && <CircleAnimation />}
        {activeBurst !== null && <BurstAnimation burst={activeBurst} />}
        {activeBurst === null ? (
          <Heart color={post.isLiked ? HEART_COLOR : colors.mutedForeground} />
        ) : (
          <AnimatingHeart onComplete={finishBurst} />
        )}
      </View>
      <View className="min-w-3">
        <AnimatedNumber value={post.likeCount} className="text-base" />
      </View>
    </Pressable>
  );
};
