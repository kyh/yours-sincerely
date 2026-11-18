import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { BlurTargetView, BlurView } from "expo-blur";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
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

/** Bottom sheet used where the web app opens a Drawer
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
  /** Fires once the sheet has left the screen, so a parent can unmount it. */
  onExitComplete?: () => void;
  children: ReactNode;
}

const SETTLE_SPRING = { damping: 30, overshootClamping: true, stiffness: 300 };
const DISMISS_DISTANCE_RATIO = 0.4;
const DISMISS_VELOCITY = 800;
const HANDLE_HIT_SLOP = { bottom: 16, left: 48, right: 48, top: 8 };

const DrawerBackdropContext = createContext<RefObject<View | null> | undefined>(undefined);

export const useDrawerBackdrop = () => useContext(DrawerBackdropContext);

/** Android blur needs an explicit target beneath the separate Modal view tree. */
export const DrawerBackdropProvider = ({ children }: { children: ReactNode }) => {
  const target = useRef<View | null>(null);

  return (
    <DrawerBackdropContext value={target}>
      <BlurTargetView ref={target} style={{ flex: 1 }}>
        {children}
      </BlurTargetView>
    </DrawerBackdropContext>
  );
};

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

export const BottomDrawer = ({ open, onClose, onExitComplete, children }: BottomDrawerProps) => {
  const blurTarget = useDrawerBackdrop();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotionEnabled = useReducedMotion();
  const [closing, setClosing] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);

  if (previousOpen !== open) {
    setPreviousOpen(open);
    setClosing(!open && !reduceMotionEnabled);
  } else if (closing && reduceMotionEnabled) {
    setClosing(false);
  }

  const visible = open || closing;

  const wasVisible = useRef(visible);
  useEffect(() => {
    if (wasVisible.current && !visible) {
      onExitComplete?.();
    }

    wasVisible.current = visible;
  }, [visible, onExitComplete]);

  const previousSettings = useRef({ open: false, reduceMotionEnabled });
  const translateY = useSharedValue(windowHeight);
  const dragStartY = useSharedValue(0);
  const sheetHeight = useSharedValue(windowHeight);

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
      if (translateY.get() >= sheetHeight.get()) {
        translateY.set(windowHeight);
      }

      translateY.set(withSpring(0, SETTLE_SPRING));
    } else {
      translateY.set(
        withSpring(sheetHeight.get(), SETTLE_SPRING, (finished) => {
          if (finished === true) {
            scheduleOnRN(setClosing, false);
          }
        }),
      );
    }
  }, [open, reduceMotionEnabled, sheetHeight, translateY, windowHeight]);

  const pan = panGesture()
    .enabled(open)
    .activeOffsetY([-10, 10])
    .onStart((event) => {
      "worklet";
      dragStartY.set(translateY.get() - event.translationY);
    })
    .onChange((event) => {
      "worklet";
      const offset = dragStartY.get() + event.translationY;
      translateY.set(offset < 0 ? -Math.sqrt(-offset) : offset);
    })
    .onEnd((event) => {
      "worklet";
      const dismissDistance = sheetHeight.get() * DISMISS_DISTANCE_RATIO;

      if (translateY.get() > dismissDistance || event.velocityY > DISMISS_VELOCITY) {
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", paddingTop: insets.top + 12 }}>
            <AnimatedView className="absolute inset-0 bg-black/10" style={scrimStyle}>
              <BlurView
                blurMethod="dimezisBlurViewSdk31Plus"
                blurTarget={blurTarget}
                intensity={16}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close drawer"
                className="flex-1"
                onPress={onClose}
              />
            </AnimatedView>
            <AnimatedView
              style={[
                {
                  flexShrink: 1,
                  maxHeight: Math.min(windowHeight * 0.8, windowHeight - insets.top - 12),
                },
                sheetStyle,
              ]}
            >
              <View
                accessibilityViewIsModal
                onAccessibilityEscape={onClose}
                className="bg-popover border-border rounded-t-xl border-t px-4"
                style={{ flexShrink: 1, paddingBottom: insets.bottom + 12 }}
                onLayout={(event) => {
                  sheetHeight.set(event.nativeEvent.layout.height);
                }}
              >
                <GestureDetector gesture={pan}>
                  <View className="items-center pt-4" hitSlop={HANDLE_HIT_SLOP}>
                    <View className="bg-muted h-1.5 w-[100px] rounded-full" />
                  </View>
                </GestureDetector>
                <ScrollView
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ flexGrow: 0, flexShrink: 1 }}
                >
                  {children}
                </ScrollView>
              </View>
            </AnimatedView>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};
