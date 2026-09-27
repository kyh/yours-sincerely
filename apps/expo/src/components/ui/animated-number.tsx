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

/** NumberFlow substitute — a per-digit odometer. Each digit lives in a
    fixed-height, overflow-clipped column and rolls vertically when it
    changes; unchanged digits stay put. Adding/removing a column (e.g. 9→10)
    fades the new leading digit in. Digits use tabular figures so columns
    never shift horizontally. */

// ~600ms settle, subtle overshoot — matches NumberFlow's feel.
const SPRING = { damping: 20, mass: 1, stiffness: 170 };

const TABULAR: TextStyle = { fontVariant: ["tabular-nums"] };

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One glyph of a column's dial. The dial is a conceptually infinite strip:
    `position` is an unbounded index and each glyph places itself at its
    nearest wrapped offset from it, so any roll distance and any mid-roll
    retarget stays continuous — there is no strip edge to fall off. */
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
    // Wrapped distance from the dial position, centered into (-5, 5].
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
  /** The whole number this column belongs to — every column rolls the way it moved. */
  whole: number;
  /** Digit and whole number the column mounts on; it rolls to `value` from there. */
  initialValue: number;
  initialWhole: number;
  height: number;
  className?: string;
}) => {
  // Unbounded dial index; the shown digit is position mod 10. Rolls are
  // accumulated on `target` (not the mid-flight value) so rapid changes
  // retarget the spring smoothly instead of teleporting the dial.
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

    // Steps to the new digit rolling in the direction the whole number
    // moved (1..9 tiles — covers multi-step changes and decade wraps).
    const steps = direction >= 0 ? (value - from + 10) % 10 : -((from - value + 10) % 10);
    target.current += steps;
    position.set(withSpring(target.current, SPRING));
  }, [value, whole, position]);

  return (
    <View style={{ height, overflow: "hidden" }}>
      {/* Transparent glyph gives the column its intrinsic width. */}
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

  // Most counters never change on screen, and the odometer costs ten animated
  // tiles per digit, so it mounts on the first change.
  const [counter, setCounter] = useState<CounterState>({ from: null, value: safe });
  const next = nextCounterState(counter, safe, reduceMotionEnabled);
  if (next !== counter) {
    setCounter(next);
  }
  const { from } = next;

  // Column height is derived from the rendered text so it tracks the font
  // size the className resolves to. Until measured, the odometer holds the
  // previous value as plain text so its columns can still roll from it.
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
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
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
