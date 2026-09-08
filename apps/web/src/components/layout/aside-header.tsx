"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@repo/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Separator } from "@repo/ui/components/separator";
import { drawerItemClass } from "@/lib/drawer-item";
import { themes, useTheme } from "@/components/theme";
import { useMediaQuery } from "@repo/ui/lib/utils";
import {
  BookCheckIcon,
  GlobeLockIcon,
  HandshakeIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { useCardStack } from "@/app/(app)/posts/_components/card-stack";
import { getAvatarUrl } from "@/lib/avatars";
import { toggleFeedLayout } from "@/lib/feed-layout-actions";
import { siteConfig } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

export const AsideHeader = () => {
  const user = useWorkspaceUser();
  const { theme, setTheme } = useTheme();
  const isDesktop = useMediaQuery();
  const { setCurrentIndex } = useCardStack();

  const [open, setOpen] = useState(false);

  const currentThemeIndex = themes.findIndex((t) => t.value === theme);
  const currentTheme = themes[currentThemeIndex];

  type MenuEntry =
    | {
        kind: "link";
        id: string;
        condition: boolean;
        href: string;
        target?: string;
        icon: React.ReactNode;
        label: string;
      }
    | {
        kind: "action";
        id: string;
        condition: boolean;
        handleClick: () => void | Promise<void>;
        icon: React.ReactNode;
        label: string;
      }
    | { kind: "separator"; id: string; condition: boolean };

  const menuItems: MenuEntry[] = [
    {
      condition: !!user,
      href: `/profile/${user?.id}`,
      icon: <UserIcon aria-hidden="true" className="size-4" />,
      id: "profile",
      kind: "link",
      label: "Profile",
    },
    {
      condition: !!user,
      href: "/settings",
      icon: <SettingsIcon aria-hidden="true" className="size-4" />,
      id: "settings",
      kind: "link",
      label: "Settings",
    },
    {
      condition: !user,
      href: "/auth/sign-in",
      icon: <UserIcon aria-hidden="true" className="size-4" />,
      id: "login",
      kind: "link",
      label: "Login",
    },
    { condition: true, id: "separator-1", kind: "separator" },
    {
      condition: true,
      handleClick: () => {
        setOpen(false);
        const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
        const nextTheme = themes[nextThemeIndex];
        setTheme(nextTheme?.value ?? "system");
      },
      icon: (
        <span className="grid size-4 place-content-center">
          <span className="size-3 rounded-full ring" style={{ background: currentTheme?.color }} />
        </span>
      ),
      id: "theme",
      kind: "action",
      label: "Theme",
    },
    {
      condition: true,
      handleClick: async () => {
        await toggleFeedLayout();
        setTimeout(() => {
          setOpen(false);
          setCurrentIndex(0);
        }, 50);
      },
      icon: <LayoutDashboardIcon aria-hidden="true" className="size-4" />,
      id: "layout",
      kind: "action",
      label: "Layout",
    },
    { condition: true, id: "separator-2", kind: "separator" },
    {
      condition: true,
      href: `mailto:${siteConfig.supportEmail}?subject=Support: ${user?.id}`,
      icon: <HelpCircleIcon aria-hidden="true" className="size-4" />,
      id: "support",
      kind: "link",
      label: "Support",
      target: "_blank",
    },
    {
      condition: !isDesktop,
      href: "/about",
      icon: <BookCheckIcon aria-hidden="true" className="size-4" />,
      id: "about",
      kind: "link",
      label: "About",
    },
    {
      condition: !isDesktop,
      href: "/privacy",
      icon: <GlobeLockIcon aria-hidden="true" className="size-4" />,
      id: "privacy",
      kind: "link",
      label: "Privacy",
    },
    {
      condition: !isDesktop,
      href: "/terms",
      icon: <HandshakeIcon aria-hidden="true" className="size-4" />,
      id: "terms",
      kind: "link",
      label: "Terms",
    },
  ];

  if (isDesktop) {
    return (
      <div className="area-aside-header">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
          >
            <ProfileAvatar
              className="size-8"
              src={getAvatarUrl(user?.displayName || user?.id)}
              alt="Profile"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="end">
            {menuItems.map((item) => {
              if (!item.condition) {
                return null;
              }
              if (item.kind === "separator") {
                return <DropdownMenuSeparator key={item.id} />;
              }
              if (item.kind === "link") {
                return (
                  <DropdownMenuItem
                    key={item.id}
                    render={<Link href={item.href} target={item.target} />}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                );
              }
              return (
                <DropdownMenuItem key={item.id} onClick={item.handleClick}>
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="area-aside-header">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <ProfileAvatar
              className="size-8"
              src={getAvatarUrl(user?.displayName || user?.id)}
              alt="Profile"
            />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Settings options</DrawerDescription>
          </DrawerHeader>
          {menuItems.map((item) => {
            if (!item.condition) {
              return null;
            }
            if (item.kind === "separator") {
              return <Separator key={item.id} className="my-1" />;
            }
            if (item.kind === "link") {
              return (
                <Link
                  key={item.id}
                  className={drawerItemClass}
                  href={item.href}
                  target={item.target}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className={drawerItemClass}
                onClick={item.handleClick}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
