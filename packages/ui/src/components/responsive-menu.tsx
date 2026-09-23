"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "cn";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Separator } from "@repo/ui/components/separator";
import { Spinner } from "@repo/ui/components/spinner";
import { DESKTOP_QUERY, useMediaQuery } from "@repo/ui/lib/utils";

const itemClassName =
  "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const rowClassName = cn(itemClassName, "h-10 justify-start");

interface ResponsiveMenuContextValue {
  isDesktop: boolean;
  closeDrawer: () => void;
}

const ResponsiveMenuContext = React.createContext<ResponsiveMenuContextValue | null>(null);

const useResponsiveMenu = () => {
  const context = React.useContext(ResponsiveMenuContext);

  if (!context) {
    throw new Error("useResponsiveMenu must be used within a ResponsiveMenu.");
  }

  return context;
};

interface ResponsiveMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * A dropdown menu at `DESKTOP_QUERY` and a bottom drawer of rows below it.
 * The choice is made once here, and every part reads it from context, so a
 * call site declares its items once. Items close the menu when chosen unless
 * they pass `closeOnClick={false}`.
 */
const ResponsiveMenu = ({ open, onOpenChange, children }: ResponsiveMenuProps) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const drawerActions = React.useRef<DrawerPrimitive.Root.Actions>(null);
  const contextValue = React.useMemo(
    () => ({ closeDrawer: () => drawerActions.current?.close(), isDesktop }),
    [isDesktop],
  );

  return (
    <ResponsiveMenuContext.Provider value={contextValue}>
      {isDesktop ? (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
          {children}
        </DropdownMenu>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange} actionsRef={drawerActions} showSwipeHandle>
          {children}
        </Drawer>
      )}
    </ResponsiveMenuContext.Provider>
  );
};

type ResponsiveMenuTriggerProps = React.ComponentPropsWithRef<"button"> & {
  render?: React.ReactElement;
};

const ResponsiveMenuTrigger = (props: ResponsiveMenuTriggerProps) => {
  const { isDesktop } = useResponsiveMenu();

  return isDesktop ? <DropdownMenuTrigger {...props} /> : <DrawerTrigger {...props} />;
};

interface ResponsiveMenuContentProps {
  /** Names the drawer for assistive tech; the menu takes its name from the trigger. */
  title: string;
  description: string;
  children: React.ReactNode;
}

const ResponsiveMenuContent = ({ title, description, children }: ResponsiveMenuContentProps) => {
  const { isDesktop } = useResponsiveMenu();

  if (isDesktop) {
    return (
      <DropdownMenuContent align="end" className="w-auto min-w-40">
        {children}
      </DropdownMenuContent>
    );
  }

  return (
    <DrawerContent>
      <DrawerHeader className="sr-only">
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>{description}</DrawerDescription>
      </DrawerHeader>
      {children}
    </DrawerContent>
  );
};

interface ResponsiveMenuItemProps {
  onClick?: () => void;
  closeOnClick?: boolean;
  disabled?: boolean;
  /** Disables the item and shows a spinner while its action is in flight. */
  loading?: boolean;
  children: React.ReactNode;
}

const ResponsiveMenuItem = ({
  onClick,
  closeOnClick = true,
  disabled,
  loading = false,
  children,
}: ResponsiveMenuItemProps) => {
  const { isDesktop, closeDrawer } = useResponsiveMenu();
  const content = (
    <>
      {children}
      {loading && <Spinner aria-hidden="true" className="ml-auto size-4" />}
    </>
  );

  if (isDesktop) {
    return (
      <MenuPrimitive.Item
        data-slot="responsive-menu-item"
        className={itemClassName}
        closeOnClick={closeOnClick}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={onClick}
      >
        {content}
      </MenuPrimitive.Item>
    );
  }

  return (
    <ButtonPrimitive
      data-slot="responsive-menu-item"
      className={rowClassName}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      onClick={() => {
        onClick?.();
        if (closeOnClick) {
          closeDrawer();
        }
      }}
    >
      {content}
    </ButtonPrimitive>
  );
};

type ResponsiveMenuLinkItemProps = Omit<React.ComponentPropsWithoutRef<"a">, "className"> & {
  /** Swap the `<a>` for a router link, e.g. `render={<Link href="/settings" />}`. */
  render?: React.ReactElement;
  closeOnClick?: boolean;
};

const ResponsiveMenuLinkItem = ({
  render,
  closeOnClick = true,
  ...props
}: ResponsiveMenuLinkItemProps) => {
  const { isDesktop, closeDrawer } = useResponsiveMenu();
  const row = useRender({
    defaultTagName: "a",
    enabled: !isDesktop,
    props: {
      "data-slot": "responsive-menu-link-item",
      ...mergeProps<"a">(
        { className: rowClassName, onClick: closeOnClick ? closeDrawer : undefined },
        props,
      ),
    },
    render,
  });

  if (isDesktop) {
    return (
      <MenuPrimitive.LinkItem
        data-slot="responsive-menu-link-item"
        className={itemClassName}
        closeOnClick={closeOnClick}
        render={render}
        {...props}
      />
    );
  }

  return row;
};

const ResponsiveMenuSeparator = () => {
  const { isDesktop } = useResponsiveMenu();

  return isDesktop ? <DropdownMenuSeparator /> : <Separator className="my-1" />;
};

export {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuLinkItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
};
