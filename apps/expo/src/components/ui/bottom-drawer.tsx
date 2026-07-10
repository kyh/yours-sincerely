import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Modal, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedView } from "@/lib/css-interop";

/** Bottom sheet used where the web app opens a vaul Drawer
    (share menu, post options, new-post form). Hand-rolled gesture sheet
    (reanimated + gesture-handler) mirroring vaul's feel: smooth spring-in,
    finger-tracking drag on the grab handle, resisted upward pull,
    velocity/distance dismiss, scrim opacity tied to position.

    Every close path goes through `onClose` — the sheet keeps its Modal
    mounted until the exit spring finishes, so item-select closes animate
    out just like drag/scrim/back closes. */
type BottomDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

// Near-critically damped, overshoot-clamped so the sheet never springs past
// its rest position (an upward overshoot would flash the background below it).
const SETTLE_SPRING = { stiffness: 300, damping: 30, overshootClamping: true };
// Fraction of sheet height a downward drag must pass to dismiss on release.
const DISMISS_DISTANCE_RATIO = 0.4;
// Downward velocity (px/s) that dismisses regardless of distance.
const DISMISS_VELOCITY = 800;
// Generous grab area around the handle pill.
const HANDLE_HIT_SLOP = { top: 8, bottom: 16, left: 48, right: 48 };
const SCREEN_HEIGHT = Dimensions.get("window").height;

export const BottomDrawer = ({ open, onClose, children }: BottomDrawerProps) => {
  const insets = useSafeAreaInsets();
  // Modal stays visible through the exit animation, then unmounts.
  const [visible, setVisible] = useState(false);
  const prevOpen = useRef(false);
  // translateY: 0 = fully open, sheetHeight = fully dismissed (offscreen).
  const translateY = useSharedValue(SCREEN_HEIGHT);
  // Where the sheet sat when a drag started, so drags that begin mid-spring
  // don't teleport it.
  const dragStartY = useSharedValue(0);
  // Measured sheet height; falls back to the screen height until first layout.
  const sheetHeight = useSharedValue(SCREEN_HEIGHT);

  // Drive enter/exit from the `open` prop so every close path (item select,
  // scrim tap, hardware back, drag) animates out before the Modal unmounts.
  useEffect(() => {
    if (open === prevOpen.current) return;
    prevOpen.current = open;
    if (open) {
      // Fresh open starts offscreen; a reopen mid-exit springs back from
      // wherever the sheet currently is.
      if (!visible) translateY.value = SCREEN_HEIGHT;
      setVisible(true);
      translateY.value = withSpring(0, SETTLE_SPRING);
    } else {
      translateY.value = withSpring(sheetHeight.value, SETTLE_SPRING, (finished) => {
        // Skip hiding when the exit spring was cancelled by a reopen.
        if (finished === true) runOnJS(setVisible)(false);
      });
    }
  }, [open, visible, sheetHeight, translateY]);

  const pan = Gesture.Pan()
    // Only while open — touches during the exit animation can't drag the
    // sheet back up or cancel a dismissal the user already asked for.
    .enabled(open)
    // Attached to the grab handle only, so vertical drags inside the content
    // (e.g. scrolling the post-form input) still reach the children.
    .activeOffsetY([-10, 10])
    .onStart((event) => {
      // Baseline includes the finger travel already spent reaching the
      // activation threshold, so the first onChange doesn't snap the sheet.
      dragStartY.value = translateY.value - event.translationY;
    })
    .onChange((event) => {
      // Downward follows the finger 1:1; upward is rubber-banded (vaul-style).
      const offset = dragStartY.value + event.translationY;
      translateY.value = offset < 0 ? -Math.sqrt(-offset) : offset;
    })
    // onEnd only fires for drags that actually activated, so taps and
    // sub-threshold flicks can never trigger the velocity dismiss.
    .onEnd((event) => {
      const dismissDistance = sheetHeight.value * DISMISS_DISTANCE_RATIO;
      if (translateY.value > dismissDistance || event.velocityY > DISMISS_VELOCITY) {
        // Flip the prop; the effect above runs the exit spring from here.
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, SETTLE_SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetHeight.value], [1, 0], Extrapolation.CLAMP),
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
                sheetHeight.value = event.nativeEvent.layout.height;
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
