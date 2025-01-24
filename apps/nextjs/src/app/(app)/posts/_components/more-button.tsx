"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@init/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@init/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@init/ui/drawer";
import { dropdownMenuItemVariants } from "@init/ui/dropdown-menu";
import { toast } from "@init/ui/toast";
import { useMediaQuery } from "@init/ui/utils";
import { MoreVerticalIcon } from "lucide-react";

import type { RouterOutputs } from "@init/api";
import { api } from "@/trpc/react";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const MoreButton = ({ post }: Props) => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const router = useRouter();
  const isDesktop = useMediaQuery();

  const deleteMutation = api.post.deletePost.useMutation({
    onSuccess: () => {
      toast("You have deleted this post");
      router.push("/");
    },
  });
  const createMutation = api.flag.createFlag.useMutation({
    onSuccess: () => {
      toast("You have flagged this post, we will be reviewing it shortly");
      router.push("/");
    },
  });
  const blockMutation = api.block.createBlock.useMutation({
    onSuccess: () => {
      toast("You have blocked this user");
      router.push("/");
    },
  });

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
          return toast("You must be logged in to flag a post");
        }
        return createMutation.mutate({
          postId: post.id,
        });
      case "block":
        if (!blockerId || !blockingId) {
          return toast("Invalid block");
        }
        return blockMutation.mutate({
          blockingId,
        });
    }
  };

  const buttonClassName = isDesktop
    ? "rounded-sm p-8"
    : dropdownMenuItemVariants({ className: "w-full" });
  const menuItems = [
    <Button variant="ghost" asChild className={buttonClassName}>
      <a href={`mailto:kai@kyh.io?subject=Report YS Post: ${post.id}`}>
        Report Post
      </a>
    </Button>,
    !!user && isPostOwner && (
      <Button
        type="button"
        className={buttonClassName}
        variant="ghost"
        onClick={() => handleSubmit("delete")}
      >
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
        Stop seeing content from this user
      </Button>
    ),
  ].filter(Boolean);

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="size-8 rounded-lg p-2 transition hover:bg-accent">
            <MoreVerticalIcon className="size-4" />
          </button>
        </DialogTrigger>
        <DialogContent closeButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Post Settings</DialogTitle>
            <DialogDescription>Options for this post</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-border">
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
        <button className="size-8 rounded-lg p-2 transition hover:bg-accent">
          <MoreVerticalIcon className="size-4" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Post Settings</DrawerTitle>
          <DrawerDescription>Options for this post</DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 flex flex-col divide-y divide-border">
          {menuItems.map((item, index) => (
            <Fragment key={index}>{item}</Fragment>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
