/* oxlint-disable unicorn/prefer-module, node/global-require -- Metro resolves static assets through require() */
import { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Animated nav icons — same Lottie JSON files the web sidebar uses,
    played when the tab becomes focused. */
const icons = {
  bell: require("../../../assets/icons/bell-icon.json"),
  home: require("../../../assets/icons/home-icon.json"),
  user: require("../../../assets/icons/user-icon.json"),
};

interface Props {
  name: keyof typeof icons;
  focused: boolean;
  size?: number;
}

export const LottieTabIcon = ({ name, focused, size = 26 }: Props) => {
  const ref = useRef<LottieView>(null);
  const { resolvedTheme } = useTheme();
  const reduceMotionEnabled = useReducedMotion();

  useEffect(() => {
    if (focused && !reduceMotionEnabled) {
      ref.current?.play();
    }
  }, [focused, reduceMotionEnabled]);

  return (
    <LottieView
      ref={ref}
      source={icons[name]}
      loop={false}
      autoPlay={false}
      progress={reduceMotionEnabled ? 1 : undefined}
      style={{
        height: size,
        opacity: focused ? 1 : 0.5,
        width: size,
      }}
      // lottie-react-native appends ".**.Color" to the keypath, so "**" here
      // becomes "**.**.Color", which matches nothing; "*" (any top-level layer)
      // is the glob that recolors every stroke and fill.
      colorFilters={isDarkTheme(resolvedTheme) ? [{ color: "#FAFAFA", keypath: "*" }] : undefined}
    />
  );
};
