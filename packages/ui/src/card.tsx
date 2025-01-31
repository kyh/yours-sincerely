import * as React from "react";
import { cn } from "@init/ui/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-5 overflow-hidden rounded-xl bg-card shadow",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
