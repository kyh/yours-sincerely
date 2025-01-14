"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@init/ui/avatar";
import { Button } from "@init/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@init/ui/dropdown-menu";
import { useTheme } from "@init/ui/theme";
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
          {user && (
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user.id}`}>
                <UserIcon aria-hidden="true" className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
          )}
          {user && (
            <DropdownMenuItem asChild>
              <Link href={`/settings`}>
                <SettingsIcon aria-hidden="true" className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          )}
          {!user && (
            <DropdownMenuItem asChild>
              <Link href="/auth/sign-in">Login</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunMoonIcon aria-hidden="true" className="size-4" />
            Theme
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleFeedLayout()}>
            <LayoutDashboardIcon aria-hidden="true" className="size-4" />
            Layout
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HelpCircleIcon aria-hidden="true" className="size-4" />
            Support
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
