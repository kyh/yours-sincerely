"use client";

import React, { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { Button } from "@/app/_components/button";
import type { Post } from "../data/postschema";
import { POST_EXPIRY_DAYS_AGO } from "../data/postschema";

const postKey = "ys-post";

export const storePost = (post: Post) => {
  const postString = JSON.stringify(post);
  localStorage.setItem(postKey, postString);
};

export const getStoredPost = () => {
  const postString = localStorage.getItem(postKey) ?? "{}";
  return JSON.parse(postString) as Post;
};

export const getStoredPostAndClear = () => {
  const post = getStoredPost();
  localStorage.removeItem(postKey);
  return post;
};

type Props = {
  placeholder?: string;
  postingAs?: string | null;
  post?: Post;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  updatePostingAs: () => void;
};

export const PostForm = ({
  placeholder = "Hello world",
  post,
  postingAs,
  onSubmit,
  isSubmitting,
  updatePostingAs,
}: Props) => {
  const expiry = addDays(new Date(), POST_EXPIRY_DAYS_AGO);
  const [localPost, setLocalPost] = useState<Post>(post ?? {});

  useEffect(() => {
    if (!post) setLocalPost(getStoredPost());
  }, [post]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    storePost(Object.fromEntries(data.entries()));
    onSubmit(event);
  };

  return (
    <form className="relative h-full" method="post" onSubmit={handleSubmit}>
      <textarea
        className="h-full w-full resize-none border-none pt-6 pb-20 text-lg outline-none dark:bg-slate-800"
        name="content"
        defaultValue={localPost.content && ""}
        placeholder={placeholder}
        onBlur={(e) => storePost({ content: e.target.value })}
        required
      />
      <footer className="absolute left-0 right-0 bottom-5 flex items-center justify-between">
        <div className="text-xs">
          <span className="mb-1 block">
            {postingAs ? (
              <>
                Publishing as:{" "}
                <button
                  type="button"
                  className="underline decoration-dotted underline-offset-2"
                  onClick={updatePostingAs}
                >
                  {postingAs}
                </button>
              </>
            ) : (
              <>
                Publishing{" "}
                <button
                  type="button"
                  className="underline decoration-dotted underline-offset-2"
                  onClick={updatePostingAs}
                >
                  anonymously
                </button>
              </>
            )}
          </span>
          <span className="block text-slate-500">
            This post will expire on {format(expiry, "MMMM do")}
          </span>
        </div>
        <Button type="submit" loading={isSubmitting}>
          Publish
        </Button>
      </footer>
    </form>
  );
};
