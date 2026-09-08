import { ActivityIndicator } from "react-native";
import type { ActivityIndicatorProps } from "react-native";

import { useThemeColors } from "@/components/theme-colors";

export const Spinner = (props: ActivityIndicatorProps) => {
  const colors = useThemeColors();
  return <ActivityIndicator color={colors.mutedForeground} {...props} />;
};
