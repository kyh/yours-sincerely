import { useState } from "react";
import { Linking, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Layout, LogIn, Palette, Settings, User } from "lucide-react-native";

import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Text } from "@/components/ui/text";
import { ProfileAvatar } from "@/components/profile-avatar";
import { themes, useTheme } from "@/components/theme-provider";
import { useThemeColors } from "@/components/theme-colors";
import { useFeedLayout } from "@/lib/feed-layout";
import { siteConfig } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Port of the web aside-header avatar menu. */
const MenuItem = ({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
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

export const AvatarMenu = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useWorkspaceUser();
  const { theme, setTheme } = useTheme();
  const { layout, toggleLayout } = useFeedLayout();
  const [isOpen, setIsOpen] = useState(false);

  const cycleTheme = () => {
    const index = themes.findIndex((option) => option.id === theme);
    const next = themes[(index + 1) % themes.length];
    if (next !== undefined) setTheme(next.id);
  };

  const iconSize = 16;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={() => setIsOpen(true)}
      >
        <ProfileAvatar name={user?.displayName ?? user?.id} size={32} />
      </Pressable>
      <BottomDrawer open={isOpen} onClose={() => setIsOpen(false)}>
        {user !== null ? (
          <MenuItem
            icon={<User size={iconSize} color={colors.foreground} />}
            label="Profile"
            onPress={() => {
              setIsOpen(false);
              router.push({ pathname: "/profile/[user-id]", params: { "user-id": user.id } });
            }}
          />
        ) : (
          <MenuItem
            icon={<LogIn size={iconSize} color={colors.foreground} />}
            label="Login"
            onPress={() => {
              setIsOpen(false);
              router.push("/auth/sign-in");
            }}
          />
        )}
        <MenuItem
          icon={<Settings size={iconSize} color={colors.foreground} />}
          label="Settings"
          onPress={() => {
            setIsOpen(false);
            router.push("/settings");
          }}
        />
        <MenuItem
          icon={<Palette size={iconSize} color={colors.foreground} />}
          label={`Theme: ${themes.find((option) => option.id === theme)?.label ?? "System"}`}
          onPress={cycleTheme}
        />
        <MenuItem
          icon={<Layout size={iconSize} color={colors.foreground} />}
          label={`Layout: ${layout === "list" ? "List" : "Stack"}`}
          onPress={toggleLayout}
        />
        <MenuItem
          icon={<User size={iconSize} color={colors.foreground} />}
          label="Support"
          onPress={() => {
            setIsOpen(false);
            Linking.openURL(`mailto:${siteConfig.supportEmail}`).catch(() => undefined);
          }}
        />
      </BottomDrawer>
    </>
  );
};
