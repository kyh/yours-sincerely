"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@init/ui/dialog";
import { toast } from "@init/ui/toast";

import type { RouterOutputs } from "@init/api";
import { api } from "@/trpc/react";

type Props = {
  post: RouterOutputs["posts"]["byId"];
};

const buttonClass =
  "w-full text-slate-900 p-5 transition rounded hover:no-underline hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800";

export const MoreButton = ({ post }: Props) => {
  const router = useRouter();

  const deleteMutation = api.posts.delete.useMutation({
    onSuccess: () => {
      toast("You have flagged this post, we will be reviewing it shortly");
      router.push("/");
    },
  });
  const createMutation = api.flag.create.useMutation({
    onSuccess: () => {
      toast("You have flagged this post, we will be reviewing it shortly");
      router.push("/");
    },
  });
  const blockMutation = api.block.create.useMutation({
    onSuccess: () => {
      toast("You have blocked this user");
      router.push("/");
    },
  });

  const currentUser = api.auth.me.useQuery().data?.id;
  const isPostOwner = post?.userId === currentUser;
  const [isOpen, setIsOpen] = useState(false);

  const blockingId = post?.userId;
  const blockerId = currentUser;

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    action: string,
  ) => {
    e.preventDefault();
    if (!post?.id) return;
    switch (action) {
      case "delete":
        return deleteMutation.mutate({
          id: post.id,
        });
      case "flag":
        if (!currentUser) {
          return toast("You must be logged in to flag a post");
        }
        return createMutation.mutate({
          postId: post.id,
          userId: currentUser,
        });
      case "block":
        if (!blockerId || !blockingId) return toast("Invalid block");
        return blockMutation.mutate({
          blocker: {
            connect: {
              id: blockerId,
            },
          },
          blocking: {
            connect: {
              id: blockingId,
            },
          },
        });
    }
  };

  return (
    <>
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">See post options</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex flex-col justify-center divide-y divide-slate-200 dark:divide-slate-500">
          <a
            className={buttonClass}
            href={`mailto:kai@kyh.io?subject=Report YS Post: ${post?.id}`}
          >
            Report
          </a>
          {!!currentUser && isPostOwner && (
            <form method="post" onSubmit={(e) => handleSubmit(e, "delete")}>
              <button type="submit" className={buttonClass}>
                Delete Post
              </button>
            </form>
          )}
          {!!currentUser && !isPostOwner && (
            <form method="post" onSubmit={(e) => handleSubmit(e, "flag")}>
              <button type="submit" className={buttonClass}>
                Mark as inappropriate
              </button>
            </form>
          )}
          {!!currentUser && !isPostOwner && (
            <form method="post" onSubmit={(e) => handleSubmit(e, "block")}>
              <button type="submit" className={buttonClass}>
                Stop seeing content from this user
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
