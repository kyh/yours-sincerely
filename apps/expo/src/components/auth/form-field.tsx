import { useRef, useState } from "react";
import type { ComponentProps, RefObject } from "react";
import { Pressable } from "react-native";
import type { TextInput } from "react-native";
import { cn } from "cn";

import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

type Props = Omit<ComponentProps<typeof Input>, "ref"> & {
  label: string;
  error?: string;
  inputRef?: RefObject<TextInput | null>;
  position?: "first" | "last" | "single";
};

/** The entire web-style field focuses its native input, keeping a 44pt target. */
export const FormField = ({
  label,
  error,
  inputRef,
  position = "single",
  className,
  onFocus,
  onBlur,
  ...props
}: Props) => {
  const localRef = useRef<TextInput>(null);
  const ref = inputRef ?? localRef;
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessible={false}
      onPress={() => ref.current?.focus()}
      className={cn(
        "min-h-11 gap-1.5 border px-3 pt-4 pb-3",
        focused ? "border-primary z-10" : "border-border",
        position === "first" && "rounded-t-md",
        position === "last" && "-mt-px rounded-b-md",
        position === "single" && "rounded-md",
      )}
    >
      <Text className={cn("text-sm font-medium", error !== undefined && "text-destructive")}>
        {label}
      </Text>
      <Input
        {...props}
        ref={ref}
        accessibilityLabel={label}
        aria-invalid={error !== undefined}
        className={cn("min-h-0 rounded-none border-0 bg-transparent p-0", className)}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
      {error !== undefined && (
        <Text accessibilityRole="alert" className="text-destructive text-sm">
          {error}
        </Text>
      )}
    </Pressable>
  );
};
