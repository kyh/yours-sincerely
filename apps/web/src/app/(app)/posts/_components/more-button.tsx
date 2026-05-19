"use client";

import { Fragment, useState } from "react";
import { Button } from "@repo/ui/components/button";
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
import { useMediaQuery } from "@repo/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BanIcon, FlagIcon, MoreVerticalIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";

import type { RouterOutputs } from "@repo/api";
import { siteConfig } from "@/lib/site-config";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { useTRPC } from "@/trpc/react";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const MoreButton = ({ post }: Props) => {
  const trpc = useTRPC();
  const user = useWorkspaceUser();
  const isDesktop = useMediaQuery();

  const deleteMutation = useMutation(
    trpc.post.deletePost.mutationOptions({
      onSuccess: () => {
        toast.success("You have deleted this post");
      },
    }),
  );
  const createMutation = useMutation(
    trpc.flag.createFlag.mutationOptions({
      onSuccess: () => {
        toast.success("You have flagged this post, we will be reviewing it shortly");
      },
    }),
  );
  const blockMutation = useMutation(
    trpc.block.createBlock.mutationOptions({
      onSuccess: () => {
        toast.success("You have blocked this user");
      },
    }),
  );

  const isPostOwner = post.userId === user?.id;
  const [isOpen, setIsOpen] = useState(false);

  const blockingId = post.userId;
  const blockerId = user?.id;

  const handleSubmit = (action: "delete" | "flag" | "block") => {
    if (!post.id) return;
    switch (action) {
      case "delete":
        return deleteMutation.mutate({
          postId: post.id,
        });
      case "flag":
        if (!user) {
          return toast.error("You must be logged in to flag a post");
        }
        return createMutation.mutate({
          postId: post.id,
        });
      case "block":
        if (!blockerId || !blockingId) {
          return toast.error("Invalid block");
        }
        return blockMutation.mutate({
          blockingId,
        });
    }
  };

  const buttonClassName = isDesktop ? "rounded-sm p-8" : drawerItemClass;

  const menuItems = [
    <Button
      variant="ghost"
      nativeButton={false}
      className={buttonClassName}
      render={
        <a
          href={`mailto:${siteConfig.supportEmail}?subject=Report YS Post: ${post.id}`}
          target="_blank"
        />
      }
    >
      <FlagIcon aria-hidden="true" className="size-4" />
      Report Post
    </Button>,
    !!user && isPostOwner && (
      <Button
        type="button"
        className={buttonClassName}
        variant="ghost"
        onClick={() => handleSubmit("delete")}
      >
        <Trash2Icon aria-hidden="true" className="size-4" />
        Delete Post
      </Button>
    ),
    !!user && !isPostOwner && (
      <Button
        type="button"
        className={buttonClassName}
        variant="ghost"
        onClick={() => handleSubmit("flag")}
      >
        <TriangleAlertIcon aria-hidden="true" className="size-4" />
        Mark as inappropriate
      </Button>
    ),
    !!user && !isPostOwner && (
      <Button
        type="button"
        className={buttonClassName}
        variant="ghost"
        onClick={() => handleSubmit("block")}
      >
        <BanIcon aria-hidden="true" className="size-4" />
        Stop seeing content from this user
      </Button>
    ),
  ].filter(Boolean);

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="hover:bg-accent size-8 cursor-pointer rounded-lg p-2 transition">
          <MoreVerticalIcon className="size-4" />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Post Settings</DialogTitle>
            <DialogDescription>Options for this post</DialogDescription>
          </DialogHeader>
          <div className="divide-border flex flex-col divide-y">
            {menuItems.map((item, index) => (
              <Fragment key={index}>{item}</Fragment>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button className="hover:bg-accent size-8 cursor-pointer rounded-lg p-2 transition">
          <MoreVerticalIcon className="size-4" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Post Settings</DrawerTitle>
          <DrawerDescription>Options for this post</DrawerDescription>
        </DrawerHeader>
        <div className="divide-border mt-4 flex flex-col divide-y">
          {menuItems.map((item, index) => (
            <Fragment key={index}>{item}</Fragment>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
