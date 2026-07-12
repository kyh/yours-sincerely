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

import { Text } from "@/components/ui/text";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/** NumberFlow substitute — a per-digit odometer. Each digit lives in a
    fixed-height, overflow-clipped column and rolls vertically when it
    changes; unchanged digits stay put. Adding/removing a column (e.g. 9→10)
    fades the new leading digit in. Digits use tabular figures so columns
    never shift horizontally. */

// ~600ms settle, subtle overshoot — matches NumberFlow's feel.
const SPRING = { damping: 20, stiffness: 170, mass: 1 };

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
    let offset = (((digit - position.value) % 10) + 10) % 10;
    if (offset > 5) offset -= 10;
    return { transform: [{ translateY: offset * height }] };
  });

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0 }, tileStyle]}>
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
  direction,
  height,
  className,
}: {
  value: number;
  direction: number;
  height: number;
  className?: string;
}) => {
  // Unbounded dial index; the shown digit is position mod 10. Rolls are
  // accumulated on `target` (not the mid-flight value) so rapid changes
  // retarget the spring smoothly instead of teleporting the dial.
  const position = useSharedValue(value);
  const target = useRef(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    if (from === value) return;
    previous.current = value;

    // Steps to the new digit rolling in the direction the whole number
    // moved (1..9 tiles — covers multi-step changes and decade wraps).
    const steps = direction >= 0 ? (value - from + 10) % 10 : -((from - value + 10) % 10);
    target.current += steps;
    position.set(withSpring(target.current, SPRING));
  }, [value, direction, position]);

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
  const chars = text.split("");
  const len = chars.length;

  // Roll direction: recomputed each render against the value from the last
  // committed change (updated in the effect below, after this render reads it).
  const previous = useRef(safe);
  const direction = safe >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = safe;
  }, [safe]);

  // Column height is derived from the rendered text so it tracks the font
  // size the className resolves to. Until measured we render the plain number.
  const [height, setHeight] = useState(0);

  if (reduceMotionEnabled) {
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
        style={[TABULAR, { position: "absolute", opacity: 0 }]}
        className={cn("text-muted-foreground text-sm", className)}
      >
        0
      </Text>

      {height === 0 ? (
        <Text style={TABULAR} className={cn("text-muted-foreground text-sm", className)}>
          {text}
        </Text>
      ) : (
        chars.map((ch, i) => {
          // Key by position from the right (ones = 0) so a column keeps its
          // identity as leading digits appear/disappear.
          const position = len - 1 - i;
          return (
            <Animated.View
              key={position}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <Digit
                value={Number(ch)}
                direction={direction}
                height={height}
                className={className}
              />
            </Animated.View>
          );
        })
      )}
    </View>
  );
};
