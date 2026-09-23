"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { getReadingTime } from "@repo/contracts/content";

import { orpc } from "@/orpc/react";
import { PostContent } from "../_components/post-content";
import { PostForm } from "../_components/post-form";

interface Props {
  postId: string;
}

// The Navigation API lists only this origin's entries, so canGoBack is false on
// a link opened from another site; history.length covers browsers without it.
const canGoBackInApp = () =>
  typeof navigation === "undefined" ? window.history.length > 1 : navigation.canGoBack;

export const PostPage = ({ postId }: Props) => {
  const router = useRouter();
  const {
    data: { post },
  } = useSuspenseQuery(orpc.post.getPost.queryOptions({ input: { postId } }));

  const goBack = () => {
    if (canGoBackInApp()) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const stats = getReadingTime(post.content);

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
          onDeleted={() => router.replace("/")}
        />
      </Card>
      <PostForm parentId={post.id} placeholder="Comment on this love letter..." />
      <div>
        <h3 className="flex items-center gap-2 py-3">
          <span className="text-muted-foreground text-sm">Comments ({post.commentCount})</span>
          <span className="bg-border h-px flex-1" />
        </h3>
        <div className="divide-border divide-y">
          {!post.comments?.length && (
            <div className="h-full py-5 text-center text-sm">No comments</div>
          )}
          {post.comments?.map((comment) => (
            <div key={comment.id} className="pt-5 pb-3">
              <PostContent post={comment} showTimer={false} showComment={false} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
