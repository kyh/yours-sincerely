import type { SharedValue } from "react-native-reanimated";
import type { TextStyle } from "react-native";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { CounterState } from "@/components/ui/odometer";
import { nextCounterState, odometerColumns } from "@/components/ui/odometer";
import { Text } from "@/components/ui/text";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "cn";

const SPRING = { damping: 20, mass: 1, stiffness: 170 };

const TABULAR: TextStyle = { fontVariant: ["tabular-nums"] };

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const DigitTile = ({
  digit,
  position,
  height,
  className,
}: {
  digit: number;
  position: SharedValue<number>;
  height: number;
  className?: string;
}) => {
  const tileStyle = useAnimatedStyle(() => {
    let offset = (((digit - position.get()) % 10) + 10) % 10;

    if (offset > 5) {
      offset -= 10;
    }

    return { transform: [{ translateY: offset * height }] };
  });

  return (
    <Animated.View style={[{ left: 0, position: "absolute", right: 0, top: 0 }, tileStyle]}>
      <Text
        style={[TABULAR, { height, lineHeight: height, textAlign: "center" }]}
        className={cn("text-muted-foreground text-sm", className)}
      >
        {digit}
      </Text>
    </Animated.View>
  );
};

const Digit = ({
  value,
  whole,
  initialValue,
  initialWhole,
  height,
  className,
}: {
  value: number;
  whole: number;
  initialValue: number;
  initialWhole: number;
  height: number;
  className?: string;
}) => {
  const position = useSharedValue(initialValue);
  const target = useRef(initialValue);
  const previous = useRef(initialValue);
  const previousWhole = useRef(initialWhole);

  useEffect(() => {
    const direction = whole >= previousWhole.current ? 1 : -1;
    previousWhole.current = whole;

    const from = previous.current;

    if (from === value) {
      return;
    }

    previous.current = value;

    const steps = direction >= 0 ? (value - from + 10) % 10 : -((from - value + 10) % 10);
    target.current += steps;
    position.set(withSpring(target.current, SPRING));
  }, [value, whole, position]);

  return (
    <View style={{ height, overflow: "hidden" }}>
      <Text
        style={[TABULAR, { height, lineHeight: height, opacity: 0 }]}
        className={cn("text-muted-foreground text-sm", className)}
      >
        0
      </Text>
      {DIGITS.map((digit) => (
        <DigitTile
          key={digit}
          digit={digit}
          position={position}
          height={height}
          className={className}
        />
      ))}
    </View>
  );
};

export const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const reduceMotionEnabled = useReducedMotion();
  const safe = Math.max(0, Math.trunc(value));
  const text = String(safe);

  const [counter, setCounter] = useState<CounterState>({ from: null, value: safe });
  const next = nextCounterState(counter, safe, reduceMotionEnabled);

  if (next !== counter) {
    setCounter(next);
  }

  const { from } = next;

  const [height, setHeight] = useState(0);

  if (from === null) {
    return (
      <Text
        accessibilityLabel={text}
        style={TABULAR}
        className={cn("text-muted-foreground text-sm", className)}
      >
        {text}
      </Text>
    );
  }

  return (
    <View accessible accessibilityLabel={text} style={{ flexDirection: "row" }}>
      <Text
        onLayout={(e) => {
          setHeight(e.nativeEvent.layout.height);
        }}
        style={[TABULAR, { opacity: 0, position: "absolute" }]}
        className={cn("text-muted-foreground text-sm", className)}
      >
        0
      </Text>

      {height === 0 ? (
        <Text style={TABULAR} className={cn("text-muted-foreground text-sm", className)}>
          {String(from)}
        </Text>
      ) : (
        odometerColumns(safe, from).map((column) => (
          <Animated.View
            key={column.position}
            entering={column.from === null ? FadeIn.duration(200) : undefined}
            exiting={FadeOut.duration(150)}
          >
            <Digit
              value={column.digit}
              whole={safe}
              initialValue={column.from ?? column.digit}
              initialWhole={from}
              height={height}
              className={className}
            />
          </Animated.View>
        ))
      )}
    </View>
  );
};
