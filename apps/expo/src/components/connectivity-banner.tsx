import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react-native";
import { cn } from "cn";

import { Text } from "@/components/ui/text";
import { isDarkTheme, useTheme } from "@/components/theme-provider";
import { refreshConnectivity } from "@/lib/connectivity";
import { ignoreRejection } from "@/lib/ignore-rejection";

export const ConnectivityBanner = () => {
  const { resolvedTheme } = useTheme();
  const dark = isDarkTheme(resolvedTheme);
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

  if (online) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      className={cn(
        "absolute right-4 bottom-24 left-4 z-50 flex-row items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-lg",
        dark ? "bg-neutral-100" : "bg-neutral-900",
      )}
    >
      <View className="flex-1 gap-0.5">
        <Text className={cn("text-sm font-semibold", dark ? "text-neutral-900" : "text-white")}>
          You&apos;re offline
        </Text>
        <Text className={cn("text-xs", dark ? "text-neutral-600" : "text-neutral-300")}>
          Already loaded letters remain available. New activity will load when you reconnect.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry connection"
        disabled={checking}
        accessibilityState={{ busy: checking, disabled: checking }}
        hitSlop={8}
        className={cn(
          "h-11 w-11 items-center justify-center rounded-full",
          dark ? "bg-black/10 active:bg-black/20" : "bg-white/10 active:bg-white/20",
        )}
        onPress={async () => {
          setChecking(true);
          await ignoreRejection(refreshConnectivity());
          setChecking(false);
        }}
      >
        <RefreshCw size={18} color={dark ? "#171717" : "#fff"} />
      </Pressable>
    </View>
  );
};
