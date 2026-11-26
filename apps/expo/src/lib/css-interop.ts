import type { ComponentProps, ComponentType } from "react";
import type { ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { useCssElement } from "react-native-css";
import { GestureHandlerRootView as RNGestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

/** react-native-css only auto-wraps core RN components. Third-party
    components need `className` mapped to `style` by hand — import
    these wrappers instead of the originals when styling with classes. */
type WithClassName<P> = P & { className?: string };

const classNameToStyle = { className: "style" } as const;

export const SafeAreaView = (props: WithClassName<ComponentProps<typeof RNSafeAreaView>>) =>
  useCssElement(RNSafeAreaView, props, classNameToStyle);

export const GestureHandlerRootView = (
  props: WithClassName<ComponentProps<typeof RNGestureHandlerRootView>>,
) => useCssElement(RNGestureHandlerRootView, props, classNameToStyle);

type AnimatedViewProps = ComponentProps<typeof Animated.View>;

const AnimatedBase: ComponentType<Pick<ViewProps, "style">> = Animated.View;

export const AnimatedView = (props: WithClassName<AnimatedViewProps>) =>
  useCssElement(AnimatedBase, props, classNameToStyle);
