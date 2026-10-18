import { useState } from "react";
import { Easing, View } from "react-native";
import { Tabs } from "expo-router/js-tabs";

import { useThemeColors } from "@/components/theme-colors";
import { useReducedMotion } from "@/lib/use-reduced-motion";

// Home is the tab a cold start or deep link lands under.
export const unstable_settings = { anchor: "index" };

// AppShell owns the persistent bar, including navigation from detail screens.
const hideTabBar = () => null;

const TabLayout = () => {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  return (
    <View className="flex-1" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Tabs
        backBehavior="history"
        tabBar={hideTabBar}
        screenOptions={{
          animation: reduceMotion ? "none" : "shift",
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-width, 0, width],
                  }),
                },
              ],
            },
          }),
          transitionSpec: {
            animation: "timing",
            config: { duration: reduceMotion ? 0 : 240, easing: Easing.out(Easing.cubic) },
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
};

export default TabLayout;
