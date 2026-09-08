import { Tabs } from "expo-router";

import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { NotificationsTabIcon } from "@/components/notifications/notifications-tab-icon";
import { useThemeColors } from "@/components/theme-colors";

interface TabIconProps {
  focused: boolean;
}

const HomeTabIcon = ({ focused }: TabIconProps) => <LottieTabIcon name="home" focused={focused} />;
const NotificationIcon = ({ focused }: TabIconProps) => <NotificationsTabIcon focused={focused} />;
const ProfileTabIcon = ({ focused }: TabIconProps) => (
  <LottieTabIcon name="user" focused={focused} />
);

const TabsLayout = () => {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: HomeTabIcon,
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: NotificationIcon,
          title: "Notifications",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ProfileTabIcon,
          title: "Profile",
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
