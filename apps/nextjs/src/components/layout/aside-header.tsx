"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@init/ui/avatar";
import { Button } from "@init/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@init/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  dropdownMenuItemVariants,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@init/ui/dropdown-menu";
import { useTheme } from "@init/ui/theme";
import { useMediaQuery } from "@init/ui/utils";
import {
  HelpCircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  SunMoonIcon,
  UserIcon,
} from "lucide-react";

import { getAvatarUrl } from "@/lib/avatars";
import { toggleFeedLayout } from "@/lib/feed-layout-actions";
import { api } from "@/trpc/react";

export const AsideHeader = () => {
  const { theme, setTheme } = useTheme();
  const [{ user }] = api.auth.workspace.useSuspenseQuery();

  const menuItems = [
    {
      id: "profile",
      condition: user,
      wrap: true,
      content: (
        <Link
          className={dropdownMenuItemVariants()}
          href={`/profile/${user?.id}`}
        >
          <UserIcon aria-hidden="true" className="size-4" />
          Profile
        </Link>
      ),
    },
    {
      id: "settings",
      condition: user,
      wrap: true,
      content: (
        <Link className={dropdownMenuItemVariants()} href={`/settings`}>
          <SettingsIcon aria-hidden="true" className="size-4" />
          Settings
        </Link>
      ),
    },
    {
      id: "login",
      condition: !user,
      wrap: true,
      content: (
        <Link className={dropdownMenuItemVariants()} href="/auth/sign-in">
          <UserIcon aria-hidden="true" className="size-4" />
          Login
        </Link>
      ),
    },
    {
      id: "separator-1",
      condition: true,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "theme",
      condition: true,
      wrap: true,
      content: (
        <button
          className={dropdownMenuItemVariants({ className: "w-full" })}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <SunMoonIcon aria-hidden="true" className="size-4" />
          Theme
        </button>
      ),
    },
    {
      id: "layout",
      condition: true,
      wrap: true,
      content: (
        <button
          className={dropdownMenuItemVariants({ className: "w-full" })}
          onClick={() => toggleFeedLayout()}
        >
          <LayoutDashboardIcon aria-hidden="true" className="size-4" />
          Layout
        </button>
      ),
    },
    {
      id: "separator-2",
      condition: true,
      wrap: false,
      content: <DropdownMenuSeparator />,
    },
    {
      id: "support",
      condition: true,
      wrap: true,
      content: (
        <Link className={dropdownMenuItemVariants()} href={`/settings`}>
          <HelpCircleIcon aria-hidden="true" className="size-4" />
          Support
        </Link>
      ),
    },
  ];

  const isDesktop = useMediaQuery();

  if (isDesktop) {
    return (
      <div className="area-aside-header">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Avatar className="size-8">
                <AvatarImage
                  className="dark:invert"
                  src={getAvatarUrl(user?.displayName || user?.id)}
                  alt="Profile image"
                />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="end">
            {menuItems.map((item) => {
              if (!item.condition) {
                return null;
              }
              if (!item.wrap) {
                return <Fragment key={item.id}>{item.content}</Fragment>;
              }
              return (
                <DropdownMenuItem key={item.id} asChild>
                  {item.content}
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
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar className="size-8">
              <AvatarImage
                className="dark:invert"
                src={getAvatarUrl(user?.displayName || user?.id)}
                alt="Profile image"
              />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
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
            return <Fragment key={item.id}>{item.content}</Fragment>;
          })}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
