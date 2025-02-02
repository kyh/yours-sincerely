import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@init/ui/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

const labelVariants = cva(
  "flex items-center gap-1 text-xs font-medium text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
