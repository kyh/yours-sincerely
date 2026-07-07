import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

import { BalloonsProvider } from "@/components/animations/balloons";
import { FeedLayoutProvider } from "@/components/feed-layout-provider";
import { GestureHandlerRootView } from "@/lib/css-interop";
import { isDarkTheme, ThemeProvider, useTheme } from "@/components/theme-provider";
import { useThemeColors } from "@/components/theme-colors";
import { queryClient } from "@/lib/api";

import "../styles.css";
import "@/lib/css-interop";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const RootStack = () => {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Toaster />
      <StatusBar style={isDarkTheme(resolvedTheme) ? "light" : "dark"} />
    </>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FeedLayoutProvider>
              <BalloonsProvider>
                <RootStack />
              </BalloonsProvider>
            </FeedLayoutProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
