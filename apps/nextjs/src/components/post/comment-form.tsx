"use client";

import { useEffect, useState } from "react";
import {
  isPostContentValid,
  POST_EXPIRY_DAYS_AGO,
} from "@init/api/lib/post-utils";
import { Button } from "@init/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@init/ui/dialog";
import { toast } from "@init/ui/toast";
import { addDays, format } from "date-fns";

import type { RouterOutputs } from "@init/api";
import { api } from "@/trpc/react";

const postKey = "ys-post";

export const storePost = (post: { content: string }) => {
  const postString = JSON.stringify(post);
  localStorage.setItem(postKey, postString);
};

export const getStoredPost = () => {
  const postString = localStorage.getItem(postKey) ?? "{}";
  return JSON.parse(postString) as { content?: string };
};

export const clearStoredPost = () => {
  localStorage.removeItem(postKey);
};

type PostFormProps = {
  user: RouterOutputs["auth"]["me"];
  placeholder?: string;
};

export const PostForm = ({ user, placeholder }: PostFormProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdBy, setCreatedBy] = useState(user?.displayName ?? "");
  const [postContent, setPostContent] = useState("");

  const expiry = addDays(new Date(), POST_EXPIRY_DAYS_AGO);

  useEffect(() => {
    const storedPost = getStoredPost();
    setPostContent(storedPost.content ?? "");
  }, []);

  const { mutate, isPending } = api.posts.create.useMutation({
    onSuccess: () => {
      toast.message("Your love letter has been published");
      clearStoredPost();
    },
    onError: (err) => {
      console.error(err);
      toast.error("You got some errors");
    },
  });

  const updateCreatedBy = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const input = Object.fromEntries(data.entries()) as {
      createdBy: string;
    };
    setCreatedBy(input.createdBy);
    setIsModalOpen(false);
  };

  const submitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPostContentValid(postContent)) {
      toast.message("You'll need to write a bit more than that");
      return;
    }

    if (user?.disabled) {
      toast.error("Your account has been disabled");
      return;
    }

    mutate({
      content: postContent,
      createdBy: createdBy,
    });
  };

  return (
    <>
      <form
        className="flex flex-col gap-2 border-b border-border pb-5"
        onSubmit={submitPost}
      >
        <div className="textarea-grow" data-textarea-value={postContent}>
          <textarea
            id="postContent"
            name="postContent"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onBlur={(e) => storePost({ content: e.target.value })}
            placeholder={placeholder}
            required
          />
        </div>
        <footer className="flex items-center justify-between">
          <div className="text-xs">
            <span className="mb-1 block">
              Publishing {createdBy ? "as: " : ""}
              <button
                type="button"
                className="underline decoration-dotted underline-offset-2"
                onClick={() => setIsModalOpen(true)}
              >
                {createdBy ? createdBy : "anonymously"}
              </button>
            </span>
            <span className="block text-slate-500">
              This post will expire on {format(expiry, "MMMM do")}
            </span>
          </div>
          <Button type="submit" loading={isPending}>
            Publish
          </Button>
        </footer>
      </form>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Even ghostwriters have names</DialogTitle>
            <DialogDescription>
              <form method="post" onSubmit={updateCreatedBy}>
                <label htmlFor="createdBy">I'd like to publish as</label>
                <input
                  id="createdBy"
                  name="createdBy"
                  placeholder="Bojack the horse"
                  required
                />
                <Button type="submit" className="mt-4 pl-8 pr-8">
                  Save and continue
                </Button>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
