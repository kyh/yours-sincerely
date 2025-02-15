"use client";

import * as React from "react";
import { cn } from "@init/ui/utils";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root>;

export const Avatar = ({ className, ...props }: AvatarProps) => (
  <AvatarPrimitive.Root
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
);

type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>;

export const AvatarImage = ({ className, ...props }: AvatarImageProps) => (
  <AvatarPrimitive.Image
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
);

type AvatarFallbackProps = React.ComponentProps<
  typeof AvatarPrimitive.Fallback
>;

export const AvatarFallback = ({
  className,
  ...props
}: AvatarFallbackProps) => (
  <AvatarPrimitive.Fallback
    className={cn(
      "bg-muted flex h-full w-full items-center justify-center rounded-full",
      className,
    )}
    {...props}
  />
);

type ProfileAvatarProps = {
  className?: string;
  src?: string;
};

export const ProfileAvatar = ({ className, src }: ProfileAvatarProps) => {
  return (
    <Avatar className={className}>
      <AvatarImage
        className="dark-purple:invert dark:invert"
        src={src}
        alt="Profile image"
      />
      <AvatarFallback>A</AvatarFallback>
    </Avatar>
  );
};
