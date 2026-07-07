import type { ComponentProps, ComponentType } from "react";
import Animated from "react-native-reanimated";
import { styled } from "react-native-css";
import {
  GestureHandlerRootView as RNGestureHandlerRootView,
} from "react-native-gesture-handler";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

/** react-native-css only auto-wraps core RN components. Third-party
    components need the `styled()` HOC for `className` to work — import
    these wrappers instead of the originals when styling with classes. */
type Styled<P> = ComponentType<P & { className?: string }>;

export const SafeAreaView: Styled<ComponentProps<typeof RNSafeAreaView>> = styled(
  RNSafeAreaView,
  { className: "style" },
);

export const GestureHandlerRootView: Styled<ComponentProps<typeof RNGestureHandlerRootView>> =
  styled(RNGestureHandlerRootView, { className: "style" });

export const AnimatedView: Styled<ComponentProps<typeof Animated.View>> =
  // @ts-expect-error TS2590 — styled's const-generic inference explodes on
  // Animated.View's prop union; the export is typed explicitly above.
  styled(Animated.View, { className: "style" });
