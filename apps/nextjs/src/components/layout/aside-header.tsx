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
          {!user && (
            <DropdownMenuItem asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HelpIcon aria-hidden="true" className="size-4" />
            Support
          </DropdownMenuItem>
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut.mutate()}>
                <LogoutIcon aria-hidden="true" className="size-4" />
                Log out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
