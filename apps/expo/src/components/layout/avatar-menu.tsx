import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useRouter } from "expo-router";
import {
  BookCheck,
  GlobeLock,
  Handshake,
  HelpCircle,
  LayoutDashboard,
  Settings,
  User,
} from "lucide-react-native";

import { BottomDrawer, DrawerItem } from "@/components/ui/bottom-drawer";
import { Text } from "@/components/ui/text";
import { ProfileAvatar } from "@/components/profile-avatar";
import { themes, useTheme } from "@/components/theme-provider";
import { useThemeColors } from "@/components/theme-colors";
import { useFeedLayout } from "@/lib/feed-layout";
import { siteConfig, supportMailto } from "@/lib/site-config";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

type MenuState =
  | { kind: "closed" }
  | { kind: "drawer" }
  | { kind: "dropdown"; left: number; top: number };

const DROPDOWN_SHADOW = (
  Platform.OS === "android" && Number(Platform.Version) < 28
    ? { elevation: 4 }
    : { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)" }
) satisfies ViewStyle;

const DropdownItem = ({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="menuitem"
    hitSlop={6}
    className="active:bg-accent min-h-8 flex-row items-center gap-2 rounded-sm px-2 py-1.5"
    onPress={onPress}
  >
    {icon}
    <Text className="text-sm">{label}</Text>
  </Pressable>
);

const AvatarDropdown = ({
  anchor,
  children,
  onClose,
}: {
  anchor: { left: number; top: number };
  children: ReactNode;
  onClose: () => void;
}) => {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotionEnabled = useReducedMotion();
  const [menuHeight, setMenuHeight] = useState(0);

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      navigationBarTranslucent
      animationType={reduceMotionEnabled ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        className="absolute inset-0"
        onPress={onClose}
      />
      <View
        accessibilityViewIsModal
        accessibilityRole="menu"
        onAccessibilityEscape={onClose}
        className="bg-popover border-foreground/10 rounded-md border p-1"
        onLayout={(event) => setMenuHeight(event.nativeEvent.layout.height)}
        style={[
          DROPDOWN_SHADOW,
          {
            left: Math.max(8, Math.min(anchor.left, width - 168)),
            maxHeight: height - insets.top - insets.bottom - 16,
            position: "absolute",
            top: Math.max(
              insets.top + 8,
              Math.min(anchor.top, height - menuHeight - insets.bottom - 8),
            ),
            width: 160,
          },
        ]}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          style={{ flexGrow: 0, flexShrink: 1 }}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
};

/** Port of the web aside-header avatar menu, including its 640px menu breakpoint. */
export const AvatarMenu = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const { user, isPending, isError } = useWorkspaceUser();
  const { theme, setTheme } = useTheme();
  const { toggleLayout } = useFeedLayout();
  const [menu, setMenu] = useState<MenuState>({ kind: "closed" });
  const trigger = useRef<View>(null);
  const MenuItem = wide ? DropdownItem : DrawerItem;
  const showLogin = user === null && !isPending && !isError;

  const close = () => setMenu({ kind: "closed" });
  const cycleTheme = () => {
    const index = themes.findIndex((option) => option.id === theme);
    const next = themes[(index + 1) % themes.length];
    if (next !== undefined) {
      setTheme(next.id);
      close();
    }
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
      close();
    } catch {
      toast.error("Couldn't open the link. Please try again.");
    }
  };

  const items = (
    <>
      <MenuItem
        icon={<User size={16} color={colors.foreground} />}
        label={showLogin ? "Login" : "Profile"}
        onPress={() => {
          close();
          if (user !== null) {
            router.push({ params: { "user-id": user.id }, pathname: "/profile/[user-id]" });
          } else if (showLogin) {
            router.push("/auth/sign-in");
          } else {
            router.push("/profile");
          }
        }}
      />
      {user !== null && (
        <MenuItem
          icon={<Settings size={16} color={colors.foreground} />}
          label="Settings"
          onPress={() => {
            close();
            router.push("/settings");
          }}
        />
      )}
      <View className="bg-border my-1 h-px" />
      <MenuItem
        icon={
          <View className="size-4 items-center justify-center">
            <View
              className="border-foreground size-3 rounded-full border"
              style={{
                backgroundColor:
                  theme === "system"
                    ? colors.background
                    : themes.find((option) => option.id === theme)?.color,
              }}
            />
          </View>
        }
        label="Theme"
        onPress={cycleTheme}
      />
      <MenuItem
        icon={<LayoutDashboard size={16} color={colors.foreground} />}
        label="Layout"
        onPress={() => {
          toggleLayout();
          close();
        }}
      />
      <View className="bg-border my-1 h-px" />
      <MenuItem
        icon={<HelpCircle size={16} color={colors.foreground} />}
        label="Support"
        onPress={() => openUrl(supportMailto(user?.id))}
      />
      {!wide && (
        <>
          <MenuItem
            icon={<BookCheck size={16} color={colors.foreground} />}
            label="About"
            onPress={() => openUrl(`${siteConfig.url}/about`)}
          />
          <MenuItem
            icon={<GlobeLock size={16} color={colors.foreground} />}
            label="Privacy"
            onPress={() => openUrl(`${siteConfig.url}/privacy`)}
          />
          <MenuItem
            icon={<Handshake size={16} color={colors.foreground} />}
            label="Terms"
            onPress={() => openUrl(`${siteConfig.url}/terms`)}
          />
        </>
      )}
    </>
  );

  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        accessibilityState={{ expanded: menu.kind !== "closed" }}
        hitSlop={4}
        className="size-9 items-center justify-center"
        onLayout={close}
        onPress={() => {
          if (wide) {
            trigger.current?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
              setMenu({
                kind: "dropdown",
                left: x + triggerWidth - 160,
                top: y + triggerHeight + 4,
              });
            });
          } else {
            setMenu({ kind: "drawer" });
          }
        }}
      >
        <ProfileAvatar name={user?.displayName || user?.id} size={32} />
      </Pressable>
      <BottomDrawer open={menu.kind === "drawer"} onClose={close}>
        {items}
      </BottomDrawer>
      {menu.kind === "dropdown" && (
        <AvatarDropdown anchor={menu} onClose={close}>
          {items}
        </AvatarDropdown>
      )}
    </>
  );
};
