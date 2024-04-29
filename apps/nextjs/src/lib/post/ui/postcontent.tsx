"use client";

import Link from "next/link";

import type { Post } from "../data/postschema";
import { ProfileLink } from "@/app/_components/profilelink";
import { CommentButton } from "./commentbutton";
import { LikeButton } from "./likebutton";
import { MoreButton } from "./morebutton";
import { ShareButton } from "./sharebutton";
import { Timer } from "./timer";

type Props = {
  post: Post;
  displayFull?: boolean;
  asLink?: boolean;
  showLike?: boolean;
  showComment?: boolean;
  showTimer?: boolean;
  showShare?: boolean;
  showMore?: boolean;
};

export const PostContent = ({
  post,
  displayFull = false,
  asLink = true,
  showLike = true,
  showComment = true,
  showTimer = true,
  showShare = true,
  showMore = false,
}: Props) => {
  return (
    <article
      className={`${
        displayFull
          ? "article word-break flex h-full w-full flex-col"
          : "article"
      }`}
    >
      {asLink ? (
        <Link
          className="block text-slate-900 hover:no-underline dark:text-slate-50"
          href={`/posts/${post.id}`}
        >
          <p className="whitespace-pre-wrap text-lg">{post.content}</p>
        </Link>
      ) : (
        <p
          className={`whitespace-pre-wrap text-lg ${
            displayFull ? "min-h-[50vh]" : ""
          }`}
        >
          {post.content}
        </p>
      )}
      <footer
        className={`flex flex-col sm:flex-row sm:justify-between ${
          displayFull ? "mt-auto pt-3" : "mt-5"
        }`}
      >
        <div className="italic sm:flex sm:items-center">
          <span className="mr-1 align-[1px]">Yours Sincerely,</span>
          {post.userId && post.createdBy && (
            <ProfileLink userId={post.userId} displayName={post.createdBy} />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between sm:mt-0 sm:gap-1">
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
