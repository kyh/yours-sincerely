import type { ReactNode } from "react";
import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/* Mirrors packages/ui button variants (pill buttons). */
const buttonVariants = cva(
  "flex-row items-center justify-center rounded-full border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-primary",
        outline: "border-border bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        destructive: "bg-destructive/10",
        link: "bg-transparent",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        sm: "h-8 gap-1 px-3",
        lg: "h-10 gap-1.5 px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      destructive: "text-destructive",
      link: "text-primary underline",
    },
  },
  defaultVariants: {
    variant: "default",
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

export const Button = ({
  className,
  textClassName,
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <Pressable
    accessibilityRole="button"
    className={cn(
      buttonVariants({ variant, size }),
      (loading === true || disabled === true) && "opacity-50",
      className,
    )}
    disabled={loading === true || disabled === true}
    {...props}
  >
    {loading === true ? <ActivityIndicator size="small" /> : null}
    {typeof children === "string" ? (
      <Text className={cn(buttonTextVariants({ variant }), textClassName)}>{children}</Text>
    ) : (
      children
    )}
  </Pressable>
);
