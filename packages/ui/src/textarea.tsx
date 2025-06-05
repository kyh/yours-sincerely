import * as React from "react";
import { cn } from "@repo/ui/utils";

export type TextareaProps = React.ComponentProps<"textarea">;

export const Textarea = ({ className, ...props }: TextareaProps) => {
  return (
    <textarea
      className={cn(
        "border-border placeholder:text-muted-foreground focus-visible:ring-ring shadow-xs focus-visible:outline-hidden flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
};
