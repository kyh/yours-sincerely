import { Tabs } from "expo-router";

import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { NotificationsTabIcon } from "@/components/notifications/notifications-tab-icon";
import { useThemeColors } from "@/components/theme-colors";

type TabIconProps = { focused: boolean };

const HomeTabIcon = ({ focused }: TabIconProps) => <LottieTabIcon name="home" focused={focused} />;
const NotificationIcon = ({ focused }: TabIconProps) => <NotificationsTabIcon focused={focused} />;
const ProfileTabIcon = ({ focused }: TabIconProps) => (
  <LottieTabIcon name="user" focused={focused} />
);

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: NotificationIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tabs>
  );
}
