import { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Animated nav icons — same Lottie JSON files the web sidebar uses,
    played when the tab becomes focused. */
const icons = {
  home: require("../../../assets/icons/home-icon.json"),
  bell: require("../../../assets/icons/bell-icon.json"),
  user: require("../../../assets/icons/user-icon.json"),
};

type Props = {
  name: keyof typeof icons;
  focused: boolean;
  size?: number;
};

export const LottieTabIcon = ({ name, focused, size = 26 }: Props) => {
  const ref = useRef<LottieView>(null);
  const { resolvedTheme } = useTheme();
  const reduceMotionEnabled = useReducedMotion();

  useEffect(() => {
    if (focused && !reduceMotionEnabled) ref.current?.play();
  }, [focused, reduceMotionEnabled]);

  return (
    <LottieView
      ref={ref}
      source={icons[name]}
      loop={false}
      autoPlay={false}
      progress={reduceMotionEnabled ? 1 : undefined}
      style={{
        width: size,
        height: size,
        opacity: focused ? 1 : 0.5,
      }}
      colorFilters={isDarkTheme(resolvedTheme) ? [{ keypath: "**", color: "#FAFAFA" }] : undefined}
    />
  );
};
