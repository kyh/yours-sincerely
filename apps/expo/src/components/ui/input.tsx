import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";

import { cn } from "@/lib/utils";
import { useThemeColors } from "@/components/theme-colors";

export const Input = ({ className, ...props }: TextInputProps) => {
  const colors = useThemeColors();
  return (
    <TextInput
      className={cn(
        "border-input bg-background text-foreground h-10 w-full rounded-lg border px-3 py-2 font-sans text-base",
        className,
      )}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
  );
};
