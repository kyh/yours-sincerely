import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";

/** Port of apps/web/src/components/animations/balloons.tsx (Web Animations
    API → reanimated). Same color pairs and easings; depth is simulated with
    scale instead of CSS 3D perspective. */

const colorPairs: [string, string][] = [
  ["#ffec37ee", "#f8b13dff"], // yellow
  ["#f89640ee", "#c03940ff"], // red
  ["#3bc0f0ee", "#0075bcff"], // blue
  ["#b0cb47ee", "#3d954bff"], // green
  ["#cf85b8ee", "#a3509dff"], // purple
];

const easings = [
  Easing.bezier(0.22, 1, 0.36, 1), // easeOutQuint
  Easing.bezier(0.33, 1, 0.68, 1), // easeOutCubic
];

type BalloonConfig = {
  id: number;
  lightColor: string;
  balloonColor: string;
  x: number;
  targetX: number;
  scale: number;
  width: number;
  duration: number;
  delay: number;
  tiltAngle: number;
  tiltDirection: 1 | -1;
  easingIndex: number;
};

const BalloonShape = ({
  width,
  lightColor,
  balloonColor,
}: {
  width: number;
  lightColor: string;
  balloonColor: string;
}) => {
  const height = width * 1.25;
  return (
    <Svg width={width} height={height} viewBox="0 0 100 125">
      <Defs>
        <RadialGradient id="balloon-shine" cx="35%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={lightColor} />
          <Stop offset="100%" stopColor={balloonColor} />
        </RadialGradient>
      </Defs>
      <Ellipse cx="50" cy="50" rx="46" ry="50" fill="url(#balloon-shine)" />
      <Path d="M46 99 L54 99 L50 108 Z" fill={balloonColor} />
      <Path
        d="M50 108 C 46 114, 54 119, 50 125"
        stroke={balloonColor}
        strokeWidth="1.5"
        fill="none"
      />
    </Svg>
  );
};

const Balloon = ({ config, screenHeight }: { config: BalloonConfig; screenHeight: number }) => {
  const balloonHeight = config.width * 1.25;
  const travel = screenHeight + balloonHeight * 2;

  const y = useSharedValue(0);
  const x = useSharedValue(config.x);
  const rotate = useSharedValue(-config.tiltDirection * config.tiltAngle);

  const easing = easings[config.easingIndex] ?? Easing.linear;

  // Kick off on mount — float up with sway + alternating tilt.
  y.value = withDelay(config.delay, withTiming(-travel, { duration: config.duration, easing }));
  x.value = withDelay(
    config.delay,
    withTiming(config.targetX, { duration: config.duration, easing }),
  );
  rotate.value = withDelay(
    config.delay,
    withSequence(
      withTiming(config.tiltDirection * config.tiltAngle, { duration: config.duration / 2 }),
      withTiming(-config.tiltDirection * config.tiltAngle, { duration: config.duration / 2 }),
    ),
  );

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
      { scale: config.scale },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: "absolute", top: screenHeight, left: -config.width / 2 }, style]}
    >
      <BalloonShape
        width={config.width}
        lightColor={config.lightColor}
        balloonColor={config.balloonColor}
      />
    </Animated.View>
  );
};

type BalloonsContextValue = {
  celebrate: () => void;
};

const BalloonsContext = createContext<BalloonsContextValue>({ celebrate: () => undefined });

export const useBalloons = () => useContext(BalloonsContext);

export const BalloonsProvider = ({ children }: { children: ReactNode }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [balloonBatch, setBalloonBatch] = useState<BalloonConfig[] | null>(null);
  const nextId = useRef(0);

  const celebrate = useCallback(() => {
    const balloonWidth = Math.min(screenWidth, screenHeight) * 0.4;
    const amount = Math.max(7, Math.round(screenWidth / (balloonWidth / 2)));

    const configs: BalloonConfig[] = [];
    let maxLifetime = 0;
    for (let i = 0; i < amount; i++) {
      const colorPair = colorPairs[i % colorPairs.length] ?? colorPairs[0];
      if (colorPair === undefined) continue;
      const duration = (Math.random() * 1000 + 5000) * 2;
      const delay = i * 200;
      maxLifetime = Math.max(maxLifetime, duration + delay);
      configs.push({
        id: nextId.current++,
        lightColor: colorPair[0],
        balloonColor: colorPair[1],
        x: Math.round(screenWidth * Math.random()),
        targetX: Math.round(
          screenWidth * Math.random() +
            balloonWidth * 2 * (Math.random() > 0.5 ? 1 : -1),
        ),
        scale: 0.4 + Math.random() * 0.6,
        width: balloonWidth,
        duration,
        delay,
        tiltAngle: Math.random() * (15 - 8) + 8,
        tiltDirection: Math.random() < 0.5 ? 1 : -1,
        easingIndex: Math.floor(Math.random() * easings.length),
      });
    }

    setBalloonBatch(configs);
    setTimeout(() => setBalloonBatch(null), maxLifetime + 500);
  }, [screenWidth, screenHeight]);

  const contextValue = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <BalloonsContext.Provider value={contextValue}>
      {children}
      {balloonBatch !== null && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            overflow: "hidden",
          }}
        >
          {balloonBatch.map((config) => (
            <Balloon key={config.id} config={config} screenHeight={screenHeight} />
          ))}
        </View>
      )}
    </BalloonsContext.Provider>
  );
};
