import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

import { useThemeColors } from "@/components/theme-colors";

export const Spinner = (props: ActivityIndicatorProps) => {
  const colors = useThemeColors();
  return <ActivityIndicator color={colors.mutedForeground} {...props} />;
};
