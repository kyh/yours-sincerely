import type { ReactNode } from "react";
import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable } from "react-native";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { z } from "zod";

import { Text } from "@/components/ui/text";
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
        default: "h-9 gap-1.5 px-4",
        icon: "size-9",
        "icon-lg": "size-10",
        "icon-sm": "size-8",
        lg: "h-10 gap-1.5 px-5",
        sm: "h-8 gap-1 px-3",
      },
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive/10",
        ghost: "bg-transparent",
        link: "bg-transparent",
        outline: "border-border bg-background",
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

export const Button = ({
  className,
  textClassName,
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const label = buttonLabel.safeParse(children);
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        buttonVariants({ size, variant }),
        (loading === true || disabled === true) && "opacity-50",
        className,
      )}
      disabled={loading === true || disabled === true}
      {...props}
    >
      {loading === true ? <ActivityIndicator size="small" /> : null}
      {label.success ? (
        <Text className={cn(buttonTextVariants({ variant }), textClassName)}>{label.data}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};
