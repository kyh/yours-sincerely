"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@init/ui/utils";

import type { FeedLayout } from "@/lib/feed-layout-actions";
import type { RouterOutputs } from "@init/api";
import { ProfileLink } from "@/app/(app)/profile/_components/profile-link";
import { CommentButton } from "./comment-button";
import { MoreButton } from "./more-button";
import { ShareButton } from "./share-button";
import { Timer } from "./timer";

const LikeButton = dynamic(() => import("./like-button"), {
  ssr: false,
  loading: () => (
    <span className="relative flex h-8 items-center gap-1.5 p-2">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="currentColor"
      >
        <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z" />
      </svg>
      <span className="min-w-[0.75rem]" />
    </span>
  ),
});

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
        <div className="mt-3 flex items-center justify-between text-muted-foreground sm:mt-0 sm:gap-1">
          {showComment && <CommentButton post={post} />}
          {showLike && <LikeButton post={post} />}
          {showTimer && <Timer post={post} />}
          {showShare && <ShareButton post={post} />}
          {showMore && <MoreButton post={post} />}
        </div>
      </footer>
    </article>
  );
};
