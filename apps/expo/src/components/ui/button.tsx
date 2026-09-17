import type { ReactNode } from "react";
import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable, View } from "react-native";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { z } from "zod";

import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";
import { cn } from "cn";

/* Mirrors packages/ui button variants (pill buttons). */
const buttonVariants = cva(
  "flex-row items-center justify-center rounded-full border border-transparent",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "min-h-9 gap-1.5 px-2.5",
        icon: "size-9",
        "icon-lg": "size-10",
        "icon-sm": "size-8 rounded-md",
        lg: "min-h-10 gap-1.5 px-2.5",
        sm: "min-h-8 gap-1 rounded-md px-2.5",
      },
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive/10 dark:bg-destructive/20",
        ghost: "bg-transparent",
        link: "bg-transparent",
        outline:
          "border-border bg-background dark:border-input dark:bg-input/30 dark-purple:border-input dark-purple:bg-input/30",
        secondary: "bg-secondary",
      },
    },
  },
);

const buttonTextVariants = cva("text-sm font-medium", {
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive",
      ghost: "text-foreground",
      link: "text-primary underline",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
    },
  },
});

type ButtonProps = Omit<PressableProps, "children"> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    /** Plain strings are wrapped in a styled Text; nodes render as-is. */
    children?: ReactNode;
    textClassName?: string;
    className?: string;
  };

const buttonLabel = z.string();
const buttonHitSlop = { default: 4, icon: 4, "icon-lg": 2, "icon-sm": 6, lg: 2, sm: 6 };
const loadingBackground = {
  default: "bg-primary",
  destructive: "bg-destructive/10",
  ghost: "bg-background",
  link: "bg-background",
  outline: "bg-background",
  secondary: "bg-secondary",
};

export const Button = ({
  className,
  textClassName,
  variant = "default",
  size,
  loading,
  disabled,
  accessibilityState,
  children,
  ...props
}: ButtonProps) => {
  const colors = useThemeColors();
  const loadingColor = {
    default: colors.primaryForeground,
    destructive: colors.destructive,
    ghost: colors.foreground,
    link: colors.primary,
    outline: colors.foreground,
    secondary: colors.foreground,
  };
  const label = buttonLabel.safeParse(children);
  const isDisabled = loading === true || disabled === true;
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={buttonHitSlop[size ?? "default"]}
      className={cn(
        buttonVariants({ size, variant }),
        isDisabled && loading !== true && "opacity-50",
        className,
      )}
      disabled={isDisabled}
      accessibilityState={{ ...accessibilityState, busy: loading === true, disabled: isDisabled }}
      {...props}
    >
      {label.success ? (
        <Text className={cn("text-center", buttonTextVariants({ variant }), textClassName)}>
          {label.data}
        </Text>
      ) : (
        children
      )}
      {loading === true && (
        <View
          pointerEvents="none"
          className={cn(
            "absolute inset-0 items-center justify-center rounded-full",
            loadingBackground[variant ?? "default"],
          )}
        >
          <ActivityIndicator size="small" color={loadingColor[variant ?? "default"]} />
        </View>
      )}
    </Pressable>
  );
};
