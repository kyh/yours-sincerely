import type { ComponentPropsWithRef } from "react";
import { TextInput } from "react-native";

import { cn } from "cn";
import { useThemeColors } from "@/components/theme-colors";

export const Input = ({ className, ...props }: ComponentPropsWithRef<typeof TextInput>) => {
  const colors = useThemeColors();
  return (
    <TextInput
      className={cn(
        "border-input bg-background text-foreground min-h-11 w-full rounded-lg border px-3 py-2 font-sans text-base",
        className,
      )}
      placeholderTextColor={colors.mutedForeground}
      {...props}
      // An explicit line height creates a word-wrapping iOS paragraph style.
      // Keep single-line fields on one line even while they are not editing.
      lineBreakModeIOS={props.lineBreakModeIOS ?? (props.multiline ? undefined : "clip")}
    />
  );
};
