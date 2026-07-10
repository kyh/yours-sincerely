import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { AnimatedView } from "@/lib/css-interop";
import { clamp01, easeIn, mix, progress, wrap } from "@/lib/motion";

/** Port of apps/web posts/_components/card-stack.tsx (motion → reanimated).
    Spring constants match the web version exactly. */

type CardStackContextType = {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
};

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

const ADVANCE_SPRING = { stiffness: 600, damping: 50 };
const SNAP_BACK_SPRING = { stiffness: 300, damping: 50 };
const STACK_SPRING = { stiffness: 600, damping: 30 };

type CardProps = {
  index: number;
  currentIndex: number;
  total: number;
  maxRotate: number;
  minDistance?: number;
  minSpeed?: number;
  setNextPost: () => void;
  children: ReactNode;
};

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
  const baseRotation = mix(0, maxRotate, Math.sin(index));
  const isCurrent = index === currentIndex;

  const x = useSharedValue(0);
  const pressed = useSharedValue(1);

  const zIndex = total - wrap(total, 0, index - currentIndex + 1);
  const opacity = clamp01(progress(total * 0.25, total * 0.75, zIndex));
  const scale = mix(0.5, 1, easeIn(clamp01(progress(0, total - 1, zIndex))));

  // Mount like the web card: from {opacity: 0, scale: 0.3} with a spring.
  const animatedOpacity = useSharedValue(0);
  const animatedScale = useSharedValue(0.3);
  useEffect(() => {
    animatedOpacity.value = withSpring(opacity, STACK_SPRING);
    animatedScale.value = withSpring(scale, STACK_SPRING);
  }, [opacity, scale, animatedOpacity, animatedScale]);

  const pan = Gesture.Pan()
    .enabled(isCurrent)
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      pressed.value = withSpring(0.98, STACK_SPRING);
    })
    .onChange((event) => {
      x.value = event.translationX;
    })
    .onFinalize((event) => {
      pressed.value = withSpring(1, STACK_SPRING);
      const distance = Math.abs(event.translationX);
      const speed = Math.abs(event.velocityX);
      if (distance > minDistance || speed > minSpeed) {
        runOnJS(setNextPost)();
        x.value = withSpring(0, ADVANCE_SPRING);
      } else {
        x.value = withSpring(0, SNAP_BACK_SPRING);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      x.value,
      [0, 400],
      [baseRotation, baseRotation + 10],
      Extrapolation.EXTEND,
    );
    return {
      opacity: animatedOpacity.value,
      transform: [
        { translateX: x.value },
        { rotate: `${rotate}deg` },
        { scale: animatedScale.value * pressed.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <AnimatedView
        className="absolute inset-0 rounded-2xl"
        style={[{ zIndex, elevation: zIndex }, animatedStyle]}
      >
        <View
          className="bg-card rounded-2xl p-5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </AnimatedView>
    </GestureDetector>
  );
};

type Props<T> = {
  data: T[];
  render: (d: T) => ReactNode;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
};

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
    if (postsLeft <= 1 && hasNextPage && onLoadMore) onLoadMore();
    setCurrentIndex(wrap(0, data.length, safeIndex + 1));
  };

  const handleSetPreviousPost = () => {
    setCurrentIndex(wrap(0, data.length, safeIndex - 1));
  };

  return (
    <View className="flex-1 items-center gap-3 px-5 pb-4">
      <View
        className="relative h-full w-full flex-1"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {data.map((item, index) => (
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
        ))}
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
