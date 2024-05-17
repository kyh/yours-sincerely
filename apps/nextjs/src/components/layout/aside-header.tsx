"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@init/ui/avatar";
import { Button } from "@init/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@init/ui/dropdown-menu";

import type { RouterOutputs } from "@init/api";
import { HelpIcon } from "@/components/icons/help-icon";
import { LogoutIcon } from "@/components/icons/logout-icon";
import { NotificationIcon } from "@/components/icons/notification-icon";
import { ProfileIcon } from "@/components/icons/profile-icon";
import { SettingsIcon } from "@/components/icons/settings-icon";

type Props = {
  user: RouterOutputs["auth"]["me"];
};

export const AsideHeader = ({ user }: Props) => (
  <div className="area-aside-header flex items-center justify-end space-x-4 border-b border-b-border">
    <Button variant="ghost" size="icon">
      <NotificationIcon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Notifications</span>
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem>
          <ProfileIcon aria-hidden="true" className="mr-1 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon aria-hidden="true" className="mr-1 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HelpIcon aria-hidden="true" className="mr-1 h-4 w-4" />
          Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutIcon aria-hidden="true" className="mr-1 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
