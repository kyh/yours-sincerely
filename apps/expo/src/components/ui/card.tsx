import type { ViewProps } from "react-native";
import { View } from "react-native";

import { cn } from "@/lib/utils";

/* Mirrors packages/ui card: bg-card, rounded-xl, padded, soft shadow. */
export const Card = ({ className, ...props }: ViewProps) => (
  <View
    className={cn("bg-card flex flex-col gap-5 overflow-hidden rounded-xl p-5", className)}
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }}
    {...props}
  />
);
