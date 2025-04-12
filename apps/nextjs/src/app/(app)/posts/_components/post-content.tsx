"use client";

import Link from "next/link";
import { cn } from "@kyh/ui/utils";

import type { FeedLayout } from "@/lib/feed-layout-actions";
import type { RouterOutputs } from "@kyh/api";
import { ProfileLink } from "@/app/(app)/profile/_components/profile-link";
import { CommentButton } from "./comment-button";
import { LikeButton } from "./like-button";
import { MoreButton } from "./more-button";
import { ShareButton } from "./share-button";
import { TimerButton } from "./timer-button";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
  layout?: FeedLayout;
  minHeight?: boolean;
  asLink?: boolean;
  showLike?: boolean;
  showComment?: boolean;
  showTimer?: boolean;
  showShare?: boolean;
  showMore?: boolean;
};

export const PostContent = ({
  post,
  layout = "list",
  minHeight = false,
  asLink = true,
  showLike = true,
  showComment = true,
  showTimer = true,
  showShare = true,
  showMore = true,
}: Props) => {
  const contentClass = cn("whitespace-pre-wrap", minHeight && "min-h-[50dvh]");

  return (
    <article
      className={cn(
        layout === "stack" && "word-break flex h-full w-full flex-col",
      )}
    >
      {asLink ? (
        <Link href={`/posts/${post.id}`}>
          <p className={contentClass}>{post.content}</p>
        </Link>
      ) : (
        <p className={contentClass}>{post.content}</p>
      )}
      <footer
        className={cn(
          "flex flex-col sm:flex-row sm:justify-between",
          layout === "stack" ? "mt-auto pt-3" : "mt-5",
        )}
      >
        <div className="flex items-center gap-1 text-sm italic">
          <span>Yours Sincerely,</span>
          {post.userId && (
            <ProfileLink userId={post.userId} displayName={post.createdBy} />
          )}
        </div>
        <div className="text-muted-foreground mt-3 flex items-center justify-between sm:mt-0 sm:gap-1">
          {showComment && <CommentButton post={post} />}
          {showLike && <LikeButton post={post} />}
          {showTimer && <TimerButton post={post} />}
          {showShare && <ShareButton post={post} />}
          {showMore && <MoreButton post={post} />}
        </div>
      </footer>
    </article>
  );
};
