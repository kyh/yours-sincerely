import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Port of apps/web/src/components/animations/balloons.tsx (Web Animations
    API → reanimated). Same color pairs, easings, sway + alternating tilt.
    The balloon art mirrors the web SVG (viewBox 223x609): gradient string,
    body, knot, soft radial shadow for volume, and lighten glints — softened
    with react-native-svg native Gaussian-blur filters. Web's CSS 3D
    perspective is approximated with per-balloon scale + paint-order depth
    sorting + a bokeh blur on the nearest balloons. */

// viewBox aspect of the source SVG (223 wide, 609 tall incl. string).
const BALLOON_VIEWBOX_WIDTH = 223;
const BALLOON_ASPECT = 609 / BALLOON_VIEWBOX_WIDTH;

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
  // paint order + bokeh, mirroring web's z-index sort (nearest on top/blurred).
  zIndex: number;
  blur: boolean;
};

const BalloonShape = ({
  width,
  lightColor,
  balloonColor,
  blur,
}: {
  width: number;
  lightColor: string;
  balloonColor: string;
  blur: boolean;
}) => {
  const height = width * BALLOON_ASPECT;
  // 8px screen-space bokeh (web uses blur(8px)) expressed in viewBox units.
  const bokehStd = (8 * BALLOON_VIEWBOX_WIDTH) / width;

  const layers = (
    <>
      {/* string */}
      <G opacity={0.8} filter="url(#string-blur)">
        <Path
          d="M117.5 253C136.167 294.5 134.7 395 125.5 453C116.3 511 133.833 578.167 125.5 606"
          stroke="url(#string-grad)"
          strokeWidth={2}
          fill="none"
        />
      </G>
      {/* balloon body */}
      <Path
        d="M176.876 204.032C181.934 198.064 209.694 160.262 210.899 127.619C213.023 70.1236 176.876 13 118.337 13C55.7949 13 18.5828 69.332 22.2724 127.619C24.0956 156.423 38.9766 178.5 51.7922 195.372C57.7811 203.257 90.0671 238.749 112.15 245.044C111.698 248.246 112.044 253.284 116.338 254H121.838V245.71C143.277 242.292 172.085 209.686 176.876 204.032Z"
        fill={balloonColor}
        opacity={0.85}
      />
      {/* knot */}
      <Path
        d="M125 256.5C125 258.433 122.09 260 118.5 260C114.91 260 112 258.433 112 256.5C112 254.567 114.91 255 118.5 255C122.09 255 125 254.567 125 256.5Z"
        fill={balloonColor}
      />
      {/* soft radial shadow — gives the body volume */}
      <G opacity={0.2}>
        <Path
          d="M178.928 128.12C178.011 152.146 172.137 162.97 154.623 184.2C141.594 199.992 128.28 215 112.805 215C104.349 215 92.739 215 65.2673 177.844C56.1123 165.461 45.4818 149.259 44.1794 128.12C41.5436 85.3424 68.1267 44 112.805 44C154.623 44 180.55 85.6242 178.928 128.12Z"
          fill="url(#body-shadow)"
        />
      </G>
      {/* primary glint */}
      <G opacity={0.7} filter="url(#glint-blur-lg)">
        <Path
          d="M72.7992 108.638L74.0985 87.5247C74.3145 84.0152 77.4883 81.4427 80.9664 81.958L94.8619 84.0166C98.4018 84.541 100.699 88.0277 99.7828 91.4871L94.0502 113.144C93.1964 116.369 89.8758 118.278 86.659 117.394L77.1969 114.792C74.4599 114.039 72.6249 111.471 72.7992 108.638Z"
          fill={lightColor}
        />
      </G>
      {/* secondary glint */}
      <G opacity={0.5} filter="url(#glint-blur-md)">
        <Path
          d="M147.76 88.7366L144.842 67.9855C144.378 64.687 141.316 62.3976 138.021 62.8858L123.638 65.0166C120.098 65.541 117.801 69.0277 118.717 72.4871L124.462 94.1891C125.311 97.3967 128.602 99.3061 131.808 98.4512L143.364 95.3695C146.296 94.5878 148.182 91.7409 147.76 88.7366Z"
          fill={lightColor}
        />
      </G>
      {/* left rim streak */}
      <G opacity={0.5} filter="url(#glint-blur-sm)">
        <Path
          d="M46.4087 131.164C38.1642 111.726 43.2454 91.2599 47.4381 82.0988C47.7504 81.4164 48.5574 80.8601 48.8712 81.5418C48.9711 81.7589 48.9188 82.1169 48.8357 82.3409C41.2341 102.832 45.5154 122.958 47.3397 130.925C47.8434 133.124 47.2898 133.242 46.4087 131.164Z"
          fill={lightColor}
        />
      </G>
      {/* right rim streak */}
      <G opacity={0.3} filter="url(#glint-blur-sm)">
        <Path
          d="M190.817 150.078C196.906 136.754 196.503 119.258 195.396 111.05C195.318 110.475 194.888 109.925 194.734 110.403C194.704 110.495 194.689 110.697 194.699 110.807C196.396 129.344 191.942 144.593 190.447 149.824C190.122 150.959 190.349 151.104 190.817 150.078Z"
          fill={lightColor}
        />
      </G>
    </>
  );

  return (
    <Svg width={width} height={height} viewBox="0 0 223 609">
      <Defs>
        <LinearGradient
          id="string-grad"
          x1={124.798}
          y1={253}
          x2={124.798}
          y2={606}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor="#ffffff" />
          <Stop offset={0.474934} stopColor="#808080" stopOpacity={0.1} />
          <Stop offset={0.722707} stopColor="#ffffff" stopOpacity={0.6} />
          <Stop offset={0.93469} stopColor="#808080" stopOpacity={0.7} />
          <Stop offset={1} stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id="body-shadow" cx={134} cy={149.5} r={78} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor="#000000" stopOpacity={1} />
          <Stop offset={1} stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <Filter id="string-blur">
          <FeGaussianBlur stdDeviation={1} />
        </Filter>
        <Filter id="glint-blur-lg">
          <FeGaussianBlur stdDeviation={5.5} />
        </Filter>
        <Filter id="glint-blur-md">
          <FeGaussianBlur stdDeviation={8} />
        </Filter>
        <Filter id="glint-blur-sm">
          <FeGaussianBlur stdDeviation={2} />
        </Filter>
        {blur && (
          <Filter id="bokeh">
            <FeGaussianBlur stdDeviation={bokehStd} />
          </Filter>
        )}
      </Defs>
      {blur ? <G filter="url(#bokeh)">{layers}</G> : layers}
    </Svg>
  );
};

const Balloon = ({ config, screenHeight }: { config: BalloonConfig; screenHeight: number }) => {
  const balloonHeight = config.width * BALLOON_ASPECT;
  const travel = screenHeight + balloonHeight * 2;

  const y = useSharedValue(0);
  const x = useSharedValue(config.x);
  const rotate = useSharedValue(-config.tiltDirection * config.tiltAngle);

  // Kick off on mount — float up with sway + alternating tilt. Runs in an
  // effect (not the render body) so re-renders never restart the flight.
  useEffect(() => {
    const easing = easings[config.easingIndex] ?? Easing.linear;
    y.set(withDelay(config.delay, withTiming(-travel, { duration: config.duration, easing })));
    x.set(
      withDelay(config.delay, withTiming(config.targetX, { duration: config.duration, easing })),
    );
    rotate.set(
      withDelay(
        config.delay,
        withSequence(
          withTiming(config.tiltDirection * config.tiltAngle, { duration: config.duration / 2 }),
          withTiming(-config.tiltDirection * config.tiltAngle, { duration: config.duration / 2 }),
        ),
      ),
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- one-shot flight per mounted balloon
  }, []);

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
        blur={config.blur}
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
  const reduceMotionEnabled = useReducedMotion();
  const [balloonBatch, setBalloonBatch] = useState<BalloonConfig[] | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (reduceMotionEnabled) setBalloonBatch(null);
  }, [reduceMotionEnabled]);

  const celebrate = useCallback(() => {
    if (reduceMotionEnabled) return;

    const balloonWidth = Math.min(screenWidth, screenHeight) * 0.4;
    const amount = Math.max(7, Math.round(screenWidth / (balloonWidth / 2)));

    type BaseConfig = Omit<BalloonConfig, "zIndex" | "blur">;
    const base: BaseConfig[] = [];
    for (let i = 0; i < amount; i++) {
      const colorPair = colorPairs[i % colorPairs.length] ?? colorPairs[0];
      if (colorPair === undefined) continue;
      base.push({
        id: nextId.current++,
        lightColor: colorPair[0],
        balloonColor: colorPair[1],
        x: Math.round(screenWidth * Math.random()),
        targetX: Math.round(
          screenWidth * Math.random() + balloonWidth * 2 * (Math.random() > 0.5 ? 1 : -1),
        ),
        scale: 0.4 + Math.random() * 0.6,
        width: balloonWidth,
        duration: (Math.random() * 1000 + 5000) * 2,
        delay: i * 200,
        tiltAngle: Math.random() * (15 - 8) + 8,
        tiltDirection: Math.random() < 0.5 ? 1 : -1,
        easingIndex: Math.floor(Math.random() * easings.length),
      });
    }

    // Depth sort: smallest (farthest) painted first, largest (nearest) on top.
    // Web bokeh-blurs the closest balloons (z-index > 7); mirror that threshold.
    const configs: BalloonConfig[] = [...base]
      // oxlint-disable-next-line unicorn/no-array-sort -- toSorted needs an ES2023 lib; the copy makes this non-mutating
      .sort((a, b) => a.scale - b.scale)
      .map((c, index) => Object.assign(c, { zIndex: index + 1, blur: index + 1 > 7 }));

    const maxLifetime = configs.reduce((max, c) => Math.max(max, c.duration + c.delay), 0);

    setBalloonBatch(configs);
    // Only clear our own batch — a later celebrate() may have replaced it.
    setTimeout(() => {
      setBalloonBatch((prev) => (prev === configs ? null : prev));
    }, maxLifetime + 500);
  }, [screenWidth, screenHeight, reduceMotionEnabled]);

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
