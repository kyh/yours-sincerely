import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { cn } from "cn";

interface ProfileAvatarProps {
  className?: string;
  displayName?: string | null;
  src?: string | null;
  alt?: string;
}

export const ProfileAvatar = ({ className, displayName, src, alt = "" }: ProfileAvatarProps) => {
  const initials = displayName?.slice(0, 1) || "?";

  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarImage className="dark-purple:invert dark:invert" src={src ?? undefined} alt={alt} />
      <AvatarFallback className="animate-in fade-in uppercase">{initials}</AvatarFallback>
    </Avatar>
  );
};
