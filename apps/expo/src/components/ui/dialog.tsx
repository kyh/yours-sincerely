import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { X } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { useThemeColors } from "@/components/theme-colors";
import { useDrawerBackdrop } from "@/components/ui/bottom-drawer";
import { Button } from "@/components/ui/button";
import { AnimatedView } from "@/lib/css-interop";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Web's centered 448px dialog, bounded by the native keyboard and safe area. */
export const Dialog = ({
  open,
  onClose,
  label,
  children,
  padding = 24,
  showCloseButton = true,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  padding?: number;
  showCloseButton?: boolean;
}) => {
  const colors = useThemeColors();
  const blurTarget = useDrawerBackdrop();
  const insets = useSafeAreaInsets();
  const reduceMotionEnabled = useReducedMotion();
  const [closing, setClosing] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    setClosing(!open && !reduceMotionEnabled);
  } else if (closing && reduceMotionEnabled) {
    setClosing(false);
  }

  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    if (reduceMotionEnabled) {
      progress.set(open ? 1 : 0);
      return;
    }
    progress.set(
      withTiming(
        open ? 1 : 0,
        { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        (finished) => {
          if (!open && finished === true) {
            scheduleOnRN(setClosing, false);
          }
        },
      ),
    );
  }, [open, progress, reduceMotionEnabled]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.95 + progress.get() * 0.05 }],
  }));

  return (
    <Modal visible={open || closing} transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 16,
            paddingTop: insets.top + 16,
          }}
        >
          <AnimatedView className="absolute inset-0 bg-black/10" style={backdropStyle}>
            <BlurView
              blurMethod="dimezisBlurViewSdk31Plus"
              blurTarget={blurTarget}
              intensity={16}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              className="flex-1"
              onPress={onClose}
            />
          </AnimatedView>
          <AnimatedView
            accessibilityViewIsModal
            accessibilityLabel={label}
            onAccessibilityEscape={onClose}
            pointerEvents={open ? "auto" : "none"}
            className="bg-popover rounded-xl"
            style={[{ flexShrink: 1, maxWidth: 448, width: "100%" }, panelStyle]}
          >
            <View
              pointerEvents="none"
              className="border-foreground/10 absolute -inset-px rounded-xl border"
            />
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ padding }}
            >
              {children}
            </ScrollView>
            {showCloseButton && (
              <Button
                accessibilityLabel="Close"
                variant="ghost"
                size="icon-sm"
                className="absolute right-4 top-4"
                onPress={onClose}
              >
                <X size={16} color={colors.foreground} />
              </Button>
            )}
          </AnimatedView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
