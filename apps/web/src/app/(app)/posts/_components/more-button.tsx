"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { reportPostMailto } from "@repo/contracts/site";
import { Button, buttonVariants } from "@repo/ui/components/button";
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
import { drawerItemClass } from "@/lib/drawer-item";
import { toast } from "@repo/ui/components/sonner";
import { DESKTOP_QUERY, useMediaQuery } from "@repo/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { BanIcon, FlagIcon, MoreVerticalIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";

import type { FeedPost } from "@repo/api";
import { refreshAfterPostDeleted, refreshBlocks, refreshPostContent } from "@/lib/query-policies";
import { useIdentityScope } from "@/lib/use-identity-scope";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";

interface Props {
  post: FeedPost;
  onDeleted?: () => void;
}

/** A confirmation replaces the menu rather than opening on top of it: the
    mobile menu is a vaul drawer, whose focus trap would fight a second modal. */
type Overlay = "menu" | "delete" | "block";

export const MoreButton = ({ post, onDeleted }: Props) => {
  const queryClient = useQueryClient();
  const user = useWorkspaceUser();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  // The item that opened a confirmation has unmounted with the menu, so focus
  // would otherwise fall to <body> when the confirmation closes.
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeOverlay = (closing: Overlay) =>
    setOverlay((current) => (current === closing ? null : current));
  const overlayState = (name: Overlay) => ({
    onOpenChange: (open: boolean) => {
      if (open) {
        setOverlay(name);
      } else {
        closeOverlay(name);
      }
    },
    open: overlay === name,
  });

  const deleteMutation = useMutation(
    orpc.post.deletePost.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async (_data, { postId }) => {
        closeOverlay("delete");
        toast.success("You have deleted this post");
        onDeleted?.();
        await refreshAfterPostDeleted(queryClient, postId);
      },
    }),
  );
  // A scope runs its mutations one at a time and holds the next until onSuccess
  // settles, so these refreshes are fired, not awaited: an awaited feed refetch
  // walks every loaded page and would queue every like and letter behind it.
  const identityScope = useIdentityScope();
  const createMutation = useMutation(
    orpc.flag.createFlag.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        closeOverlay("menu");
        toast.success("You have flagged this post, we will be reviewing it shortly");
        // Enough flags hides the post, so the feed can change.
        void refreshPostContent(queryClient);
      },
      scope: identityScope,
    }),
  );
  const blockMutation = useMutation(
    orpc.block.createBlock.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        closeOverlay("block");
        toast.success("You have blocked this user");
        // Every post by the blocked author drops out of the feed, and the
        // author joins the viewer's blocked list — refreshBlocks covers both.
        void refreshBlocks(queryClient);
      },
      scope: identityScope,
    }),
  );

  const isPostOwner = post.userId === user?.id;

  const blockingId = post.userId;
  const blockerId = user?.id;

  const handleSubmit = (action: "delete" | "flag" | "block") => {
    if (!post.id) {
      return;
    }
    switch (action) {
      case "delete": {
        return deleteMutation.mutate({
          postId: post.id,
        });
      }
      case "flag": {
        if (!user) {
          return toast.error("You must be logged in to flag a post");
        }
        return createMutation.mutate({
          postId: post.id,
        });
      }
      case "block": {
        if (!blockerId || !blockingId) {
          return toast.error("Invalid block");
        }
        return blockMutation.mutate({
          blockingId,
        });
      }
      default: {
        const exhaustive: never = action;
        throw new Error(`Unknown action ${String(exhaustive)}`);
      }
    }
  };

  const buttonClassName = isDesktop ? "rounded-sm p-8" : drawerItemClass;

  const menuItems = [
    <a
      key="report"
      aria-label="Report post"
      className={cn(buttonVariants({ className: buttonClassName, variant: "ghost" }))}
      href={reportPostMailto(post.id)}
    >
      <FlagIcon aria-hidden="true" className="size-4" />
      Report Post
    </a>,
    !!user && isPostOwner && (
      <Button
        key="delete"
        type="button"
        className={buttonClassName}
        variant="ghost"
        onClick={() => setOverlay("delete")}
      >
        <Trash2Icon aria-hidden="true" className="size-4" />
        Delete Post
      </Button>
    ),
    !!user && !isPostOwner && (
      <Button
        key="flag"
        type="button"
        className={buttonClassName}
        variant="ghost"
        loading={createMutation.isPending}
        onClick={() => handleSubmit("flag")}
      >
        <TriangleAlertIcon aria-hidden="true" className="size-4" />
        Mark as inappropriate
      </Button>
    ),
    !!user && !isPostOwner && (
      <Button
        key="block"
        type="button"
        className={buttonClassName}
        variant="ghost"
        onClick={() => setOverlay("block")}
      >
        <BanIcon aria-hidden="true" className="size-4" />
        Stop seeing content from this user
      </Button>
    ),
  ].filter(Boolean);

  const confirmations = (
    <>
      <AlertDialog {...overlayState("delete")}>
        <AlertDialogContent finalFocus={triggerRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this letter and its comments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => handleSubmit("delete")}
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog {...overlayState("block")}>
        <AlertDialogContent finalFocus={triggerRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop seeing this writer?</AlertDialogTitle>
            <AlertDialogDescription>
              Their letters will no longer appear for you. You can unblock them in Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              loading={blockMutation.isPending}
              onClick={() => handleSubmit("block")}
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (isDesktop) {
    return (
      <>
        <Dialog {...overlayState("menu")}>
          <DialogTrigger
            ref={triggerRef}
            aria-label="Post settings"
            className="hover:bg-accent size-8 cursor-pointer rounded-lg p-2 transition"
          >
            <MoreVerticalIcon aria-hidden="true" className="size-4" />
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Post Settings</DialogTitle>
              <DialogDescription>Options for this post</DialogDescription>
            </DialogHeader>
            <div className="divide-border flex flex-col divide-y">{menuItems}</div>
          </DialogContent>
        </Dialog>
        {confirmations}
      </>
    );
  }

  return (
    <>
      <Drawer {...overlayState("menu")}>
        <DrawerTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Post settings"
            className="hover:bg-accent size-8 cursor-pointer rounded-lg p-2 transition"
          >
            <MoreVerticalIcon aria-hidden="true" className="size-4" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Post Settings</DrawerTitle>
            <DrawerDescription>Options for this post</DrawerDescription>
          </DrawerHeader>
          <div className="divide-border mt-4 flex flex-col divide-y">{menuItems}</div>
        </DrawerContent>
      </Drawer>
      {confirmations}
    </>
  );
};
