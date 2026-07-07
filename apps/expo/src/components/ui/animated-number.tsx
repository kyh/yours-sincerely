import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/** NumberFlow substitute — rolls the value in/out vertically on change. */
export const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => (
  <Animated.View key={value} entering={FadeInDown.duration(200)} exiting={FadeOutUp.duration(200)}>
    <Text className={cn("text-muted-foreground text-sm", className)}>{value}</Text>
  </Animated.View>
);
