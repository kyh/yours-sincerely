import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Button } from "@/components/ui/button";
import { AnimatedView } from "@/lib/css-interop";
import { panGesture } from "@/lib/gesture";
import { clamp01, easeIn, mix, progress, wrap } from "@/lib/motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Port of apps/web posts/_components/card-stack.tsx (motion → reanimated).
    Spring constants match the web version exactly. */

interface CardStackContextType {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const CardStackContext = createContext<CardStackContextType | undefined>(undefined);

export const CardStackProvider = ({ children }: { children: ReactNode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const value = useMemo(() => ({ currentIndex, setCurrentIndex }), [currentIndex]);
  return <CardStackContext.Provider value={value}>{children}</CardStackContext.Provider>;
};

export const useCardStack = () => {
  const context = useContext(CardStackContext);
  if (context === undefined) {
    throw new Error("useCardStack must be used within a CardStackProvider");
  }
  return context;
};

const ADVANCE_SPRING = { damping: 50, stiffness: 600 };
const SNAP_BACK_SPRING = { damping: 50, stiffness: 300 };
const STACK_SPRING = { damping: 30, stiffness: 600 };

// Cards deeper than this are scaled and rotated fully behind the top card, so
// mounting them (each with its own ScrollView) only costs memory as the feed
// pages in. One card behind stays mounted so Previous springs back from where
// the stack left it.
const MOUNTED_AHEAD = 8;
const MOUNTED_BEHIND = 1;

interface CardProps {
  index: number;
  currentIndex: number;
  total: number;
  maxRotate: number;
  minDistance?: number;
  minSpeed?: number;
  setNextPost: () => void;
  children: ReactNode;
}

const Card = ({
  index,
  currentIndex,
  total,
  maxRotate,
  setNextPost,
  minDistance = 400,
  minSpeed = 50,
  children,
}: CardProps) => {
  const reduceMotionEnabled = useReducedMotion();
  const baseRotation = mix(0, maxRotate, Math.sin(index));
  const isCurrent = index === currentIndex;

  const x = useSharedValue(0);
  const pressed = useSharedValue(1);

  const zIndex = total - wrap(total, 0, index - currentIndex + 1);
  const opacity = clamp01(progress(total * 0.25, total * 0.75, zIndex));
  const scale = mix(0.5, 1, easeIn(clamp01(progress(0, total - 1, zIndex))));

  // Mount like the web card: from {opacity: 0, scale: 0.3} with a spring.
  const animatedOpacity = useSharedValue(reduceMotionEnabled ? opacity : 0);
  const animatedScale = useSharedValue(reduceMotionEnabled ? scale : 0.3);
  useEffect(() => {
    animatedOpacity.set(reduceMotionEnabled ? opacity : withSpring(opacity, STACK_SPRING));
    animatedScale.set(reduceMotionEnabled ? scale : withSpring(scale, STACK_SPRING));
  }, [opacity, scale, reduceMotionEnabled, animatedOpacity, animatedScale]);

  const pan = panGesture()
    .enabled(isCurrent)
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      pressed.set(reduceMotionEnabled ? 1 : withSpring(0.98, STACK_SPRING));
    })
    .onChange((event) => {
      x.set(event.translationX);
    })
    .onFinalize((event) => {
      pressed.set(reduceMotionEnabled ? 1 : withSpring(1, STACK_SPRING));
      const distance = Math.abs(event.translationX);
      const speed = Math.abs(event.velocityX);
      if (distance > minDistance || speed > minSpeed) {
        scheduleOnRN(setNextPost);
        x.set(reduceMotionEnabled ? 0 : withSpring(0, ADVANCE_SPRING));
      } else {
        x.set(reduceMotionEnabled ? 0 : withSpring(0, SNAP_BACK_SPRING));
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = reduceMotionEnabled
      ? baseRotation
      : interpolate(x.get(), [0, 400], [baseRotation, baseRotation + 10], Extrapolation.EXTEND);
    return {
      opacity: animatedOpacity.get(),
      transform: [
        { translateX: x.get() },
        { rotate: `${rotate}deg` },
        { scale: animatedScale.get() * pressed.get() },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <AnimatedView
        className="absolute inset-0 rounded-2xl"
        style={[{ elevation: zIndex, zIndex }, animatedStyle]}
      >
        <View
          className="bg-card rounded-2xl p-5"
          style={{
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { height: 1, width: 0 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </AnimatedView>
    </GestureDetector>
  );
};

interface Props<T> {
  data: T[];
  render: (d: T) => ReactNode;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
}

export const CardStack = <T extends { id: string }>({
  data,
  render,
  hasNextPage,
  onLoadMore,
}: Props<T>) => {
  const { currentIndex, setCurrentIndex } = useCardStack();
  const [width, setWidth] = useState(400);

  // The feed can shrink (block/delete invalidation) below currentIndex; wrap
  // it back into range so exactly one card stays gesture-enabled.
  const safeIndex = data.length > 0 ? wrap(0, data.length, currentIndex) : 0;

  const handleSetNextPost = () => {
    const postsLeft = data.length - safeIndex - 1;
    if (postsLeft <= 1 && hasNextPage && onLoadMore) {
      onLoadMore();
    }
    setCurrentIndex(wrap(0, data.length, safeIndex + 1));
  };

  const handleSetPreviousPost = () => {
    setCurrentIndex(wrap(0, data.length, safeIndex - 1));
  };

  const isMounted = (index: number) => {
    const ahead = wrap(0, data.length, index - safeIndex);
    return ahead <= MOUNTED_AHEAD || data.length - ahead <= MOUNTED_BEHIND;
  };

  return (
    <View className="flex-1 items-center gap-3 px-5 pb-4">
      <View
        className="relative h-full w-full flex-1"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {data.map((item, index) =>
          isMounted(index) ? (
            <Card
              key={item.id}
              minDistance={width * 0.5}
              maxRotate={3}
              index={index}
              currentIndex={safeIndex}
              total={data.length}
              setNextPost={handleSetNextPost}
            >
              {render(item)}
            </Card>
          ) : null,
        )}
      </View>
      <View className="flex-row items-center justify-center gap-2">
        <Button size="sm" variant="ghost" onPress={handleSetPreviousPost}>
          Previous
        </Button>
        <Button size="sm" variant="outline" onPress={handleSetNextPost}>
          Next
        </Button>
      </View>
    </View>
  );
};
