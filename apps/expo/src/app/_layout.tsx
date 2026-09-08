import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import type { ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, Text as NativeText, useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

import { BalloonsProvider } from "@/components/animations/balloons";
import { ConnectivityBanner } from "@/components/connectivity-banner";
import { FeedLayoutProvider } from "@/components/feed-layout-provider";
import { PushNotificationProvider } from "@/components/notifications/push-notification-provider";
import { SessionReconciler } from "@/components/session-reconciler";
import { GestureHandlerRootView } from "@/lib/css-interop";
import { isDarkTheme, ThemeProvider, useTheme } from "@/components/theme-provider";
import { useThemeColors } from "@/components/theme-colors";
import { queryClient } from "@/lib/api";
import { subscribeToNativeConnectivity } from "@/lib/connectivity";
import { ignoreRejection } from "@/lib/ignore-rejection";
import { palettes } from "@/lib/theme-palette";

import "../styles.css";

void ignoreRejection(SplashScreen.preventAutoHideAsync());

// Rendered above every provider, so it can only follow the OS scheme and
// must style itself without NativeWind.
export const ErrorBoundary = ({ retry }: ErrorBoundaryProps) => {
  const colors = palettes[useColorScheme() === "dark" ? "dark" : "light"];
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.background,
        flex: 1,
        gap: 16,
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <NativeText style={{ color: colors.foreground, fontSize: 24, fontWeight: "700" }}>
        This letter hit a snag
      </NativeText>
      <NativeText style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center" }}>
        Your session is safe. Try opening the page again.
      </NativeText>
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        style={{ justifyContent: "center", minHeight: 44, paddingHorizontal: 20 }}
      >
        <NativeText style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
          Try again
        </NativeText>
      </Pressable>
    </View>
  );
};

const RootStack = () => {
  const { resolvedTheme, isReady } = useTheme();
  const colors = useThemeColors();

  // Fonts are already loaded by the time this mounts (RootLayout gates on
  // them), so the stored theme is the last thing the splash waits for.
  useEffect(() => {
    if (isReady) {
      void ignoreRejection(SplashScreen.hideAsync());
    }
  }, [isReady]);

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
      <Toaster />
      <ConnectivityBanner />
      <StatusBar style={isDarkTheme(resolvedTheme) ? "light" : "dark"} />
    </>
  );
};

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // On font failure, proceed with system fonts rather than hang on the splash.
  const fontsReady = fontsLoaded || fontError !== null;

  // The probe feeds onlineManager, which query pausing, push retry, and the
  // connectivity banner all consume — it belongs beside the query client.
  useEffect(() => subscribeToNativeConnectivity(), []);

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionReconciler />
          <ThemeProvider>
            <PushNotificationProvider>
              <FeedLayoutProvider>
                <BalloonsProvider>
                  <RootStack />
                </BalloonsProvider>
              </FeedLayoutProvider>
            </PushNotificationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
