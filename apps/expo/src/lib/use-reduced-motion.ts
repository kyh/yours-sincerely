import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

type Listener = () => void;

const listeners = new Set<Listener>();
let currentValue = false;
let nativeSubscription: { remove: () => void } | undefined;

const updateValue = (enabled: boolean) => {
  if (enabled === currentValue) return;
  currentValue = enabled;
  for (const listener of listeners) listener();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);

  if (nativeSubscription === undefined) {
    nativeSubscription = AccessibilityInfo.addEventListener("reduceMotionChanged", updateValue);
    AccessibilityInfo.isReduceMotionEnabled()
      .then(updateValue)
      .catch(() => undefined);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      nativeSubscription?.remove();
      nativeSubscription = undefined;
    }
  };
};

const getSnapshot = () => currentValue;

/** Tracks the platform Reduce Motion preference, including live changes while
 * the app is running. One native subscription is shared across every caller. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
