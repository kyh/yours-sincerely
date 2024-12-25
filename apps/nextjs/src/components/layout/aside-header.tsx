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

import { BellIcon } from "@/components/icons/bell-icon";
import { HelpIcon } from "@/components/icons/help-icon";
import { LogoutIcon } from "@/components/icons/logout-icon";
import { SettingsIcon } from "@/components/icons/settings-icon";
import { UserIcon } from "@/components/icons/user-icon";
import { getAvatarUrl } from "@/lib/avatars";
import { api } from "@/trpc/react";

export const AsideHeader = () => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const signOut = api.auth.signOut.useMutation();

  return (
    <div className="area-aside-header flex items-center justify-end space-x-4 border-b border-b-border">
      <Button variant="ghost" size="icon">
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Notifications</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar className="h-8 w-8">
              <AvatarImage
                className="dark:invert"
                src={getAvatarUrl(user ? (user.displayImage ?? user.id) : "")}
                alt="Profile image"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          {user && (
            <DropdownMenuItem>
              <UserIcon aria-hidden="true" className="mr-1 h-4 w-4" />
              Profile
            </DropdownMenuItem>
          )}
          {user && (
            <DropdownMenuItem>
              <SettingsIcon aria-hidden="true" className="mr-1 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          )}
          {!user && (
            <DropdownMenuItem asChild>
              <Link href="/auth/sign-in">Login</Link>
            </DropdownMenuItem>
          )}
          {!user && (
            <DropdownMenuItem asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HelpIcon aria-hidden="true" className="mr-1 h-4 w-4" />
            Support
          </DropdownMenuItem>
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut.mutate()}>
                <LogoutIcon aria-hidden="true" className="mr-1 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
