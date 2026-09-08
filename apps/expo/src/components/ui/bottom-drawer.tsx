import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, useWindowDimensions, View } from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { Text } from "@/components/ui/text";
import { AnimatedView } from "@/lib/css-interop";
import { panGesture } from "@/lib/gesture";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Bottom sheet used where the web app opens a vaul Drawer
    (share menu, post options, new-post form). Hand-rolled gesture sheet
    (reanimated + gesture-handler) mirroring vaul's feel: smooth spring-in,
    finger-tracking drag on the grab handle, resisted upward pull,
    velocity/distance dismiss, scrim opacity tied to position.

    Every close path goes through `onClose` — the sheet keeps its Modal
    mounted until the exit spring finishes, so item-select closes animate
    out just like drag/scrim/back closes. */
interface BottomDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Near-critically damped, overshoot-clamped so the sheet never springs past
// its rest position (an upward overshoot would flash the background below it).
const SETTLE_SPRING = { damping: 30, overshootClamping: true, stiffness: 300 };
// Fraction of sheet height a downward drag must pass to dismiss on release.
const DISMISS_DISTANCE_RATIO = 0.4;
// Downward velocity (px/s) that dismisses regardless of distance.
const DISMISS_VELOCITY = 800;
// Generous grab area around the handle pill.
const HANDLE_HIT_SLOP = { bottom: 16, left: 48, right: 48, top: 8 };

/** One row of a drawer menu: icon, label, tap. */
export const DrawerItem = ({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    className="active:bg-accent flex-row items-center gap-3 rounded-lg p-4"
    onPress={onPress}
  >
    {icon}
    <Text className="text-sm font-medium">{label}</Text>
  </Pressable>
);

export const BottomDrawer = ({ open, onClose, children }: BottomDrawerProps) => {
  const insets = useSafeAreaInsets();
  // Window, not screen: iPad split view and multitasking resize the window.
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotionEnabled = useReducedMotion();
  // Modal stays mounted through the exit animation, then unmounts. Reduce
  // motion has no exit animation, so there is nothing to stay mounted for.
  const [closing, setClosing] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    setClosing(!open && !reduceMotionEnabled);
  } else if (closing && reduceMotionEnabled) {
    setClosing(false);
  }
  const visible = open || closing;

  const previousSettings = useRef({ open: false, reduceMotionEnabled });
  // translateY: 0 = fully open, sheetHeight = fully dismissed (offscreen).
  const translateY = useSharedValue(windowHeight);
  // Where the sheet sat when a drag started, so drags that begin mid-spring
  // don't teleport it.
  const dragStartY = useSharedValue(0);
  // Measured sheet height; falls back to the window height until first layout.
  const sheetHeight = useSharedValue(windowHeight);

  // Drive enter/exit from the `open` prop so every close path (item select,
  // scrim tap, hardware back, drag) animates out before the Modal unmounts.
  useEffect(() => {
    const previous = previousSettings.current;
    if (open === previous.open && reduceMotionEnabled === previous.reduceMotionEnabled) {
      return;
    }
    previousSettings.current = { open, reduceMotionEnabled };

    if (reduceMotionEnabled) {
      translateY.set(open ? 0 : sheetHeight.get());
      return;
    }

    if (open) {
      // A sheet parked at its dismissed position is a fresh open and starts
      // offscreen; a reopen mid-exit springs back from wherever the sheet is.
      if (translateY.get() >= sheetHeight.get()) {
        translateY.set(windowHeight);
      }
      translateY.set(withSpring(0, SETTLE_SPRING));
    } else {
      translateY.set(
        withSpring(sheetHeight.get(), SETTLE_SPRING, (finished) => {
          // Skip unmounting when the exit spring was cancelled by a reopen.
          if (finished === true) {
            scheduleOnRN(setClosing, false);
          }
        }),
      );
    }
  }, [open, reduceMotionEnabled, sheetHeight, translateY, windowHeight]);

  const pan = panGesture()
    // Only while open — touches during the exit animation can't drag the
    // sheet back up or cancel a dismissal the user already asked for.
    .enabled(open)
    // Attached to the grab handle only, so vertical drags inside the content
    // (e.g. scrolling the post-form input) still reach the children.
    .activeOffsetY([-10, 10])
    .onStart((event) => {
      // Baseline includes the finger travel already spent reaching the
      // activation threshold, so the first onChange doesn't snap the sheet.
      dragStartY.set(translateY.get() - event.translationY);
    })
    .onChange((event) => {
      // Downward follows the finger 1:1; upward is rubber-banded (vaul-style).
      const offset = dragStartY.get() + event.translationY;
      translateY.set(offset < 0 ? -Math.sqrt(-offset) : offset);
    })
    // onEnd only fires for drags that actually activated, so taps and
    // sub-threshold flicks can never trigger the velocity dismiss.
    .onEnd((event) => {
      const dismissDistance = sheetHeight.get() * DISMISS_DISTANCE_RATIO;
      if (translateY.get() > dismissDistance || event.velocityY > DISMISS_VELOCITY) {
        // Flip the prop; the effect above runs the exit spring from here.
        scheduleOnRN(onClose);
      } else {
        translateY.set(reduceMotionEnabled ? 0 : withSpring(0, SETTLE_SPRING));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Modal visible={visible} transparent statusBarTranslucent onRequestClose={onClose}>
      {/* Modal hosts a separate native view tree — Android needs its own
          gesture-handler root inside it. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <AnimatedView className="absolute inset-0 bg-black/40" style={scrimStyle}>
            <Pressable accessibilityLabel="Close drawer" className="flex-1" onPress={onClose} />
          </AnimatedView>
          <AnimatedView style={sheetStyle}>
            <View
              className="bg-popover rounded-t-2xl px-4"
              style={{ paddingBottom: insets.bottom + 12 }}
              onLayout={(event) => {
                sheetHeight.set(event.nativeEvent.layout.height);
              }}
            >
              <GestureDetector gesture={pan}>
                <View className="items-center pt-3 pb-3" hitSlop={HANDLE_HIT_SLOP}>
                  <View className="bg-muted h-1.5 w-12 rounded-full" />
                </View>
              </GestureDetector>
              {children}
            </View>
          </AnimatedView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};
