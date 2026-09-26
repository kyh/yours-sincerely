"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { supportMailto } from "@repo/contracts/site";
import { Button } from "@repo/ui/components/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuLinkItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@repo/ui/components/responsive-menu";
import { themes, useTheme } from "@/components/theme";
import { DESKTOP_QUERY, useMediaQuery } from "@repo/ui/lib/utils";
import {
  BookCheckIcon,
  GlobeLockIcon,
  HandshakeIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { useCardStack } from "@/components/providers/card-stack-provider";
import { getAvatarUrl } from "@/lib/avatars";
import { toggleFeedLayout } from "@/lib/feed-layout-actions";
import { useWorkspaceUser } from "@/lib/use-workspace-user";

export const AsideHeader = () => {
  const user = useWorkspaceUser();
  const { theme, setTheme } = useTheme();
  // Desktop shows About, Privacy and Terms in the sidebar footer instead.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { setCurrentIndex } = useCardStack();

  const [open, setOpen] = useState(false);

  const currentThemeIndex = themes.findIndex((t) => t.id === theme);
  const currentTheme = themes[currentThemeIndex];

  const cycleTheme = () => {
    const nextTheme = themes[(currentThemeIndex + 1) % themes.length];
    setTheme(nextTheme?.id ?? "system");
  };

  const toggleLayout = async () => {
    await toggleFeedLayout();
    setTimeout(() => {
      setOpen(false);
      setCurrentIndex(0);
    }, 50);
  };

  return (
    <div className="area-aside-header">
      <ResponsiveMenu open={open} onOpenChange={setOpen}>
        <ResponsiveMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
        >
          <ProfileAvatar
            className="size-8"
            src={getAvatarUrl(user?.displayName || user?.id)}
            alt="Profile"
          />
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title="Settings" description="Settings options">
          {user ? (
            <>
              <ResponsiveMenuLinkItem render={<Link href={`/profile/${user.id}`} />}>
                <UserIcon aria-hidden="true" className="size-4" />
                Profile
              </ResponsiveMenuLinkItem>
              <ResponsiveMenuLinkItem render={<Link href="/settings" />}>
                <SettingsIcon aria-hidden="true" className="size-4" />
                Settings
              </ResponsiveMenuLinkItem>
            </>
          ) : (
            <ResponsiveMenuLinkItem render={<Link href="/auth/sign-in" />}>
              <UserIcon aria-hidden="true" className="size-4" />
              Login
            </ResponsiveMenuLinkItem>
          )}
          <ResponsiveMenuSeparator />
          <ResponsiveMenuItem onClick={cycleTheme}>
            <span className="grid size-4 place-content-center">
              <span
                className="size-3 rounded-full ring"
                style={{ background: currentTheme?.color }}
              />
            </span>
            Theme
          </ResponsiveMenuItem>
          <ResponsiveMenuItem onClick={toggleLayout} closeOnClick={false}>
            <LayoutDashboardIcon aria-hidden="true" className="size-4" />
            Layout
          </ResponsiveMenuItem>
          <ResponsiveMenuSeparator />
          <ResponsiveMenuLinkItem href={supportMailto(user?.id)} target="_blank">
            <HelpCircleIcon aria-hidden="true" className="size-4" />
            Support
          </ResponsiveMenuLinkItem>
          {!isDesktop && (
            <>
              <ResponsiveMenuLinkItem render={<Link href="/about" />}>
                <BookCheckIcon aria-hidden="true" className="size-4" />
                About
              </ResponsiveMenuLinkItem>
              <ResponsiveMenuLinkItem render={<Link href="/privacy" />}>
                <GlobeLockIcon aria-hidden="true" className="size-4" />
                Privacy
              </ResponsiveMenuLinkItem>
              <ResponsiveMenuLinkItem render={<Link href="/terms" />}>
                <HandshakeIcon aria-hidden="true" className="size-4" />
                Terms
              </ResponsiveMenuLinkItem>
            </>
          )}
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    </div>
  );
};
