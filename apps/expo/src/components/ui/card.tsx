import type { ViewProps } from "react-native";
import { View } from "react-native";

import { cn } from "cn";

/* Mirrors packages/ui card: bg-card, rounded-xl, padded, soft shadow. */
export const Card = ({ className, ...props }: ViewProps) => (
  <View
    className={cn("bg-card flex flex-col gap-5 overflow-hidden rounded-xl p-5", className)}
    style={{
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { height: 1, width: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    }}
    {...props}
  />
);
