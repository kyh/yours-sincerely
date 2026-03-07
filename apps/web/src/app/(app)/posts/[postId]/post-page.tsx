"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import readingTime from "reading-time";

import { useTRPC } from "@/trpc/react";
import { PostContent } from "../_components/post-content";
import { PostForm } from "../_components/post-form";

type Props = {
  postId: string;
};

export const PostPage = ({ postId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.auth.workspace.queryOptions());
  const {
    data: { post },
  } = useSuspenseQuery(trpc.post.getPost.queryOptions({ postId }));

  const goBack = () => router.back();

  const stats = readingTime(post.content);

  return (
    <>
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <p className="text-xs">{stats.text}</p>
      </header>
      <Card>
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
      <div>
        <h3 className="flex items-center gap-2 py-3">
          <span className="text-muted-foreground text-sm">
            Comments ({post.commentCount})
          </span>
          <span className="bg-border h-px flex-1" />
        </h3>
        <div className="divide-border divide-y">
          {!post.comments?.length && (
            <div className="h-full py-5 text-center text-sm">No comments</div>
          )}
          {post.comments?.map((comment) => (
            <div key={comment.id} className="pt-5 pb-3">
              <PostContent
                post={comment}
                showTimer={false}
                showComment={false}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
