"use client";

import { useRouter } from "next/navigation";
import { Button } from "@init/ui/button";
import { Card } from "@init/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import readingTime from "reading-time";

import { api } from "@/trpc/react";
import { PostContent } from "./post-content";
import { PostForm } from "./post-form";

type Props = {
  postId: string;
};

export const PostPage = ({ postId }: Props) => {
  const router = useRouter();
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const [{ post }] = api.post.getPost.useSuspenseQuery({ postId });

  const goBack = () => router.back();

  const stats = readingTime(post.content ?? "");

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <p className="text-xs">{stats.text}</p>
      </header>
      <Card className="p-5">
        <PostContent
          post={post}
          layout="stack"
          asLink={false}
          showComment={false}
        />
      </Card>
      {user && (
        <PostForm
          parentId={post.id}
          placeholder="Comment on this love letter..."
        />
      )}
      <h3 className="border-y border-border py-3 text-sm">
        Comments ({post.commentCount ?? 0})
      </h3>
      {!post.comments?.length && (
        <div className="h-full py-5 text-center">No comments</div>
      )}
      {post.comments?.map((comment) => (
        <div key={comment.id} className="pb-3 pt-5">
          <PostContent post={comment} showMore={false} />
        </div>
      ))}
    </section>
  );
};
