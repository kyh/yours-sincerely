import * as React from "react";
import { cn } from "@init/ui/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, type, ...props }: InputProps) => {
  return (
    <input
      type={type}
      className={cn(
        "block w-full bg-transparent focus:outline focus:outline-0",
        className,
      )}
      {...props}
    />
  );
};
