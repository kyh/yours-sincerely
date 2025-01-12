"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@init/ui/dialog";
import { toast } from "@init/ui/toast";

import type { RouterOutputs } from "@init/api";
import { api } from "@/trpc/react";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const MoreButton = ({ post }: Props) => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const router = useRouter();

  const deleteMutation = api.post.deletePost.useMutation({
    onSuccess: () => {
      toast("You have flagged this post, we will be reviewing it shortly");
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

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    action: string,
  ) => {
    e.preventDefault();
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
        if (!blockerId || !blockingId) return toast("Invalid block");
        return blockMutation.mutate({
          blockingId,
        });
    }
  };

  return (
    <>
      <button
        type="button"
        className="size-8 rounded-lg p-2 transition hover:bg-accent"
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
        <DialogContent className="flex flex-col justify-center divide-y divide-border">
          <a
            className="w-full rounded p-5 transition hover:no-underline"
            href={`mailto:kai@kyh.io?subject=Report YS Post: ${post.id}`}
          >
            Report
          </a>
          {!!user && isPostOwner && (
            <form method="post" onSubmit={(e) => handleSubmit(e, "delete")}>
              <button
                type="submit"
                className="w-full rounded p-5 transition hover:no-underline"
              >
                Delete Post
              </button>
            </form>
          )}
          {!!user && !isPostOwner && (
            <form method="post" onSubmit={(e) => handleSubmit(e, "flag")}>
              <button
                type="submit"
                className="w-full rounded p-5 transition hover:no-underline"
              >
                Mark as inappropriate
              </button>
            </form>
          )}
          {!!user && !isPostOwner && (
            <form method="post" onSubmit={(e) => handleSubmit(e, "block")}>
              <button
                type="submit"
                className="w-full rounded p-5 transition hover:no-underline"
              >
                Stop seeing content from this user
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
