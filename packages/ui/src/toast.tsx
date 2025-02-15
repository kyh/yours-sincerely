"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type GlobalToasterProps = React.ComponentProps<typeof Sonner>;

const GlobalToaster = ({ ...props }: GlobalToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as GlobalToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!bg-popover !text-popover-foreground !shadow-lg",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { GlobalToaster, toast };
