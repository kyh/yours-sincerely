import * as React from "react";

import { cn } from "cn";

export const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card"
    className={cn(
      "bg-card flex flex-col gap-5 overflow-hidden rounded-xl p-5 shadow-sm",
      className,
    )}
    {...props}
  />
);
