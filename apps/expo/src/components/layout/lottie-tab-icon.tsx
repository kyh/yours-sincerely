import { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";

import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import bellIcon from "../../../assets/icons/bell-icon.json";
import homeIcon from "../../../assets/icons/home-icon.json";
import userIcon from "../../../assets/icons/user-icon.json";

const icons = { bell: bellIcon, home: homeIcon, user: userIcon };

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
