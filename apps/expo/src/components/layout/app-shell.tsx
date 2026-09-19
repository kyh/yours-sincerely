import type { ReactNode } from "react";
import { Linking, Pressable, View, useWindowDimensions } from "react-native";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import { AvatarMenu } from "@/components/layout/avatar-menu";
import { Logo } from "@/components/layout/logo";
import { LottieTabIcon } from "@/components/layout/lottie-tab-icon";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationsTabIcon } from "@/components/notifications/notifications-tab-icon";
import { NewPostButton } from "@/components/post/new-post-button";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/lib/css-interop";
import { useFeedLayout } from "@/lib/feed-layout";
import { siteConfig } from "@/lib/site-config";
import { useTabNavigation } from "@/lib/use-tab-navigation";
import type { TabHref } from "@/lib/use-tab-navigation";

const routeTitles = new Map([
  ["/", "Home"],
  ["/auth/password-reset", "Request password reset"],
  ["/auth/password-update", "Set New Password"],
  ["/auth/sign-in", "Welcome back"],
  ["/auth/sign-up", "Sign up"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
  ["/settings", "Settings"],
  ["/theme-gallery", "Theme gallery"],
]);

const pageTitle = (pathname: string) => {
  if (pathname.startsWith("/profile/")) {
    return "Profile";
  }
  if (pathname.startsWith("/posts/")) {
    return "Post";
  }
  return routeTitles.get(pathname) ?? "Page not found";
};

const NavLink = ({
  children,
  label,
  href,
  selected,
  wide,
}: {
  children: ReactNode;
  label: string;
  href: TabHref;
  selected: boolean;
  wide: boolean;
}) => {
  const navigateToTab = useTabNavigation();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={4}
      className="active:bg-accent min-h-9 min-w-11 flex-row items-center justify-center gap-2 rounded-full px-4"
      onPress={() => {
        if (!selected) {
          navigateToTab(href);
        }
      }}
    >
      {children}
      {wide && <Text className="text-sm font-medium">{label}</Text>}
    </Pressable>
  );
};

const Navigation = ({ wide }: { wide: boolean }) => {
  const pathname = usePathname();

  return (
    <View
      style={
        wide
          ? { alignItems: "flex-start", gap: 4, marginLeft: -16, paddingVertical: 20 }
          : { flexDirection: "row", gap: 4, justifyContent: "space-around", paddingHorizontal: 8 }
      }
    >
      <NavLink label="Home" href="/" selected={pathname === "/"} wide={wide}>
        <LottieTabIcon name="home" focused={pathname === "/"} />
      </NavLink>
      <NavLink
        label="Notifications"
        href="/notifications"
        selected={pathname === "/notifications"}
        wide={wide}
      >
        <NotificationsTabIcon focused={pathname === "/notifications"} />
      </NavLink>
      <NavLink label="Profile" href="/profile" selected={pathname === "/profile"} wide={wide}>
        <LottieTabIcon name="user" focused={pathname === "/profile"} />
      </NavLink>
    </View>
  );
};

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    toast.error("Couldn't open the link. Please try again.");
  }
};

const SidebarFooter = () => (
  <View className="border-border mt-auto gap-2 border-t py-4">
    <Text className="text-xs">
      ©{new Date().getFullYear()}, Made with{" "}
      <Text
        accessibilityLabel="View source on GitHub"
        accessibilityRole="link"
        className="text-xs"
        onPress={() => openLink("https://github.com/kyh/yours-sincerely")}
      >
        💻
      </Text>
    </Text>
    <View className="flex-row gap-2">
      {["About", "Privacy", "Terms"].map((label) => (
        <Pressable
          key={label}
          accessibilityRole="link"
          className="min-h-11 justify-center"
          onPress={() => openLink(`${siteConfig.url}/${label.toLowerCase()}`)}
        >
          <Text className="text-xs">{label}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

/** The shell stays mounted around tabs and native detail screens. */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const navigateToTab = useTabNavigation();
  const wide = width >= 768;
  const { layout } = useFeedLayout();
  const hasAside = width >= 1096;
  const headerHeight = wide ? 80 : 50;

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <View
        style={{
          alignSelf: "center",
          flex: 1,
          flexDirection: "row",
          gap: hasAside ? 64 : 0,
          maxWidth: hasAside ? 1280 : 768,
          paddingHorizontal: 20,
          width: "100%",
        }}
      >
        {wide && (
          <View style={{ paddingBottom: insets.bottom, paddingRight: 32, width: 200 }}>
            <Pressable
              className="border-border border-b"
              accessibilityRole="link"
              accessibilityLabel="Yours Sincerely, home"
              style={{ height: headerHeight, justifyContent: "center" }}
              onPress={() => navigateToTab("/")}
            >
              <Logo />
            </Pressable>
            <Navigation wide />
            <SidebarFooter />
          </View>
        )}
        <View className="flex-1">
          <View
            className="border-border flex-row items-center justify-between gap-2 border-b"
            style={{ minHeight: headerHeight }}
          >
            <Text accessibilityRole="header" className="shrink text-2xl font-bold tracking-tight">
              {pageTitle(pathname)}
            </Text>
            {pathname === "/notifications" && <MarkAllReadButton />}
            {!hasAside && <AvatarMenu />}
          </View>
          <View className="flex-1">{children}</View>
        </View>
        {hasAside && (
          <View style={{ width: 300 }}>
            <View
              className="border-border items-end justify-center border-b"
              style={{ minHeight: headerHeight }}
            >
              <AvatarMenu />
            </View>
          </View>
        )}
      </View>
      {!wide && (
        <View className="bg-background" style={{ paddingBottom: insets.bottom + 8 }}>
          <Navigation wide={false} />
        </View>
      )}
      {pathname === "/" && (!wide || layout === "stack") && (
        <NewPostButton
          bottom={insets.bottom + (wide ? 20 : 64)}
          right={Math.max(20, (width - 1280) / 2 + 20)}
        />
      )}
    </SafeAreaView>
  );
};
