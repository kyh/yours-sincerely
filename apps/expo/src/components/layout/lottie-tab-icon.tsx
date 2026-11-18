/* oxlint-disable unicorn/prefer-module, node/global-require -- Metro resolves static assets through require() */
import { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { useReducedMotion } from "@/lib/use-reduced-motion";

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

export const LottieTabIcon = ({ name, focused, size = 24 }: Props) => {
  const ref = useRef<LottieView>(null);
  const { resolvedTheme } = useTheme();
  const reduceMotionEnabled = useReducedMotion();
  const dark = isDarkTheme(resolvedTheme);

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
        width: size,
      }}
      colorFilters={[{ color: dark ? "#FAFAFA" : "#000000", keypath: "*" }]}
    />
  );
};
