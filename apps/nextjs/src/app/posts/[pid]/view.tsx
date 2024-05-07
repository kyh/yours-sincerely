"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@init/ui/button";
import { toast } from "@init/ui/toast";

import type { RouterOutputs } from "@init/api";
import { BackButton } from "@/components/post/back-button";
import { CommentContent } from "@/components/post/comment-content";
import { PostContent } from "@/components/post/post-content";
import { api } from "@/trpc/react";

const readingTime = require("reading-time/lib/reading-time");

type Props = {
  post: RouterOutputs["posts"]["byId"];
  user: RouterOutputs["user"]["byId"];
  pid: string;
};

const View = ({ post, user, pid }: Props) => {
  const utils = api.useUtils();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { mutate } = api.posts.create.useMutation({
    onSuccess: async () => {
      toast("Your comment has been added");
      await utils.posts.byId.invalidate();
      setIsLoading(false);
      redirect(`/posts/${pid}`);
    },
    onError: async (err) => {
      toast("You got some errors");
      console.log("err===>", err);
      setIsLoading(false);
      redirect(`/posts/${pid}`);
    },
  });

  const stats = readingTime(post?.content ?? "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const { content } = Object.fromEntries(formData) as {
      content: string;
    };

    mutate({
      content: content,
      createdBy: user?.displayName ?? "Anonymous",
      parentId: pid,
    });
  };

  return (
    <>
      <section className="flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <BackButton />
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {stats.text}
          </p>
        </header>
        {post && (
          <>
            <div className="w-full rounded-lg bg-slate-100 p-5 shadow dark:bg-slate-900">
              <PostContent
                post={post}
                asLink={false}
                showComment={false}
                showMore
              />
            </div>
            <div className="flex flex-col gap-3">
              {user && (
                <form
                  className="relative"
                  // action={`/posts/${post.id}/comment`}
                  // method="post"
                  onSubmit={handleSubmit}
                >
                  <textarea
                    id="comment"
                    name="content"
                    placeholder={`Reply to ${post.createdBy}`}
                    required
                  />
                  <Button
                    type="submit"
                    className="absolute bottom-5 right-5 rounded bg-slate-200 px-3 py-2 text-center text-xs transition hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                    // disabled={fetcher.state !== "idle"}
                    loading={isLoading}
                  >
                    Reply
                  </Button>
                </form>
              )}
              <h1 className="text-sm">Comments ({post.commentCount ?? 0})</h1>
              {post.comments && (
                <div className="flex flex-col gap-6">
                  {post.comments.map((comment) => (
                    <CommentContent key={comment.id} post={comment} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {!post && (
          <p className="text-lg">
            This post no longer exist or is under review
          </p>
        )}
      </section>
    </>
  );
};

export default View;
