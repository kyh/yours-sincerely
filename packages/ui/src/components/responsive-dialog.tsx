"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import { DESKTOP_QUERY, useMediaQuery } from "@repo/ui/lib/utils";

const ResponsiveDialogContext = React.createContext<{ isDesktop: boolean } | null>(null);

const useResponsiveDialog = () => {
  const context = React.useContext(ResponsiveDialogContext);

  if (!context) {
    throw new Error("useResponsiveDialog must be used within a ResponsiveDialog.");
  }

  return context;
};

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * A centered dialog at `DESKTOP_QUERY` and a bottom drawer below it, chosen
 * once here and read by every part from context.
 */
const ResponsiveDialog = ({
  open,
  onOpenChange,
  onOpenChangeComplete,
  children,
}: ResponsiveDialogProps) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const contextValue = React.useMemo(() => ({ isDesktop }), [isDesktop]);

  return (
    <ResponsiveDialogContext.Provider value={contextValue}>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
          {children}
        </Dialog>
      ) : (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          onOpenChangeComplete={onOpenChangeComplete}
          showSwipeHandle
        >
          {children}
        </Drawer>
      )}
    </ResponsiveDialogContext.Provider>
  );
};

type ResponsiveDialogTriggerProps = React.ComponentPropsWithRef<"button"> & {
  render?: React.ReactElement;
};

const ResponsiveDialogTrigger = (props: ResponsiveDialogTriggerProps) => {
  const { isDesktop } = useResponsiveDialog();

  return isDesktop ? <DialogTrigger {...props} /> : <DrawerTrigger {...props} />;
};

interface ResponsiveDialogContentProps {
  /** Announced to assistive tech, not shown. */
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * In the drawer only the handle swipes it away, so scrolling or selecting text
 * in the body never dismisses what the user is writing.
 */
const ResponsiveDialogContent = ({
  title,
  description,
  children,
}: ResponsiveDialogContentProps) => {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent>
      <DrawerHeader className="sr-only">
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>{description}</DrawerDescription>
      </DrawerHeader>
      <div className="flex min-h-0 flex-col p-4" data-base-ui-swipe-ignore>
        {children}
      </div>
    </DrawerContent>
  );
};

export { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogTrigger };
