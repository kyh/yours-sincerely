"use client";

import { formatPost } from "@init/api/post/post-utils";
import { Button } from "@init/ui/button";
import { toast } from "@init/ui/toast";
import readingTime from "reading-time";

import type { RouterOutputs } from "@init/api";
import { api } from "@/trpc/react";
import { BackButton } from "./back-button";
import { CommentContent } from "./comment-content";
import { PostContent } from "./post-content";

type Props = {
  pid: string;
  user: RouterOutputs["account"]["me"];
};

export const CommentFeed = ({ pid, user }: Props) => {
  const [post] = api.post.byId.useSuspenseQuery({ id: pid });
  const utils = api.useUtils();
  const { mutate, isPending } = api.post.create.useMutation({
    onSuccess: async () => {
      toast("Your comment has been added");
      await utils.post.byId.invalidate();
    },
    onError: async (err) => {
      toast("You got some errors");
      console.error(err);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;

    const formData = new FormData(form);
    const { content } = Object.fromEntries(formData) as {
      content: string;
    };

    mutate({
      content: content,
      createdBy: user?.displayName ?? "Anonymous",
      parentId: post.id,
    });
  };

  const stats = readingTime(post.content ?? "");

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <BackButton />
        <p className="text-xs">{stats.text}</p>
      </header>
      {post && (
        <>
          <PostContent
            post={post}
            asLink={false}
            showComment={false}
            showMore
          />
          <div className="flex flex-col gap-3">
            {user && (
              <form className="relative" onSubmit={handleSubmit}>
                <textarea
                  id="comment"
                  name="content"
                  placeholder={`Reply to ${post.createdBy}`}
                  required
                />
                <Button
                  type="submit"
                  className="absolute bottom-5 right-5 rounded bg-slate-200 px-3 py-2 text-center text-xs transition hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                  loading={isPending}
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
        <p className="text-lg">This post no longer exist or is under review</p>
      )}
    </section>
  );
};
