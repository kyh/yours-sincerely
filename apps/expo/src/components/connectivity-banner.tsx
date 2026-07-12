import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { refreshConnectivity } from "@/lib/connectivity";

export const ConnectivityBanner = () => {
  const colors = useThemeColors();
  const [online, setOnline] = useState(() => onlineManager.isOnline());
  const [checking, setChecking] = useState(false);

  useEffect(() => onlineManager.subscribe(setOnline), []);

  useEffect(() => {
    if (!online) {
      AccessibilityInfo.announceForAccessibility(
        "You're offline. New activity will load when you reconnect.",
      );
    }
  }, [online]);

  if (online) return null;

  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      className="absolute right-4 bottom-24 left-4 z-50 flex-row items-center justify-between gap-3 rounded-xl bg-neutral-900 px-4 py-3 shadow-lg dark:bg-neutral-100"
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-white dark:text-neutral-900">
          You're offline
        </Text>
        <Text className="text-xs text-neutral-300 dark:text-neutral-600">
          Already loaded letters remain available. New activity will load when you reconnect.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry connection"
        disabled={checking}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/20 dark:bg-black/10 dark:active:bg-black/20"
        onPress={() => {
          setChecking(true);
          refreshConnectivity().finally(() => setChecking(false));
        }}
      >
        <RefreshCw size={18} color={colors.background} />
      </Pressable>
    </View>
  );
};
