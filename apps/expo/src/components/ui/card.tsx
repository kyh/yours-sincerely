import type { ViewProps, ViewStyle } from "react-native";
import { Platform, View } from "react-native";

import { cn } from "cn";

/* Mirrors packages/ui card: bg-card, rounded-xl, padded, soft shadow. */
export const PAPER_SHADOW = (
  Platform.OS === "android" && Number(Platform.Version) < 28
    ? { elevation: 2 }
    : { boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)" }
) satisfies ViewStyle;

export const Card = ({ className, style, ...props }: ViewProps) => (
  <View
    className={cn("bg-card flex flex-col gap-5 overflow-hidden rounded-xl p-5", className)}
    style={[PAPER_SHADOW, style]}
    {...props}
  />
);
