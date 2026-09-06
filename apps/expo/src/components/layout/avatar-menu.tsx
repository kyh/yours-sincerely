import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BookCheck,
  GlobeLock,
  Handshake,
  HelpCircle,
  Layout,
  LogIn,
  Palette,
  Settings,
  User,
} from "lucide-react-native";

import { BottomDrawer, DrawerItem } from "@/components/ui/bottom-drawer";
import { ProfileAvatar } from "@/components/profile-avatar";
import { themes, useTheme } from "@/components/theme-provider";
import { useThemeColors } from "@/components/theme-colors";
import { useFeedLayout } from "@/lib/feed-layout";
import { siteConfig, supportMailto } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Mirrors the web menu's grouping separators. */
const MenuSeparator = () => <View className="bg-border my-1 h-px" />;

/** Port of the web aside-header avatar menu. */
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

  const openUrl = (url: string) => {
    setIsOpen(false);
    Linking.openURL(url).catch(() => undefined);
  };

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
          <DrawerItem
            icon={<User size={iconSize} color={colors.foreground} />}
            label="Profile"
            onPress={() => {
              setIsOpen(false);
              router.push({ pathname: "/profile/[user-id]", params: { "user-id": user.id } });
            }}
          />
        ) : (
          <DrawerItem
            icon={<LogIn size={iconSize} color={colors.foreground} />}
            label="Login"
            onPress={() => {
              setIsOpen(false);
              router.push("/auth/sign-in");
            }}
          />
        )}
        <DrawerItem
          icon={<Settings size={iconSize} color={colors.foreground} />}
          label="Settings"
          onPress={() => {
            setIsOpen(false);
            router.push("/settings");
          }}
        />
        <MenuSeparator />
        <DrawerItem
          icon={<Palette size={iconSize} color={colors.foreground} />}
          label={`Theme: ${themes.find((option) => option.id === theme)?.label ?? "System"}`}
          onPress={cycleTheme}
        />
        <DrawerItem
          icon={<Layout size={iconSize} color={colors.foreground} />}
          label={`Layout: ${layout === "list" ? "List" : "Stack"}`}
          onPress={toggleLayout}
        />
        <MenuSeparator />
        <DrawerItem
          icon={<HelpCircle size={iconSize} color={colors.foreground} />}
          label="Support"
          onPress={() => openUrl(supportMailto(user?.id))}
        />
        <DrawerItem
          icon={<BookCheck size={iconSize} color={colors.foreground} />}
          label="About"
          onPress={() => openUrl(`${siteConfig.url}/about`)}
        />
        <DrawerItem
          icon={<GlobeLock size={iconSize} color={colors.foreground} />}
          label="Privacy"
          onPress={() => openUrl(`${siteConfig.url}/privacy`)}
        />
        <DrawerItem
          icon={<Handshake size={iconSize} color={colors.foreground} />}
          label="Terms"
          onPress={() => openUrl(`${siteConfig.url}/terms`)}
        />
      </BottomDrawer>
    </>
  );
};
