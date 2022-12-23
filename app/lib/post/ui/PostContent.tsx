import { Link } from "@remix-run/react";
import type { SerializedPost } from "~/lib/post/data/postSchema";
import { ProfileLink } from "~/lib/core/ui/ProfileLink";
import { ShareButton } from "~/lib/post/ui/ShareButton";
import { LikeButton } from "~/lib/post/ui/LikeButton";
import { CommentButton } from "~/lib/post/ui/CommentButton";
import { Timer } from "~/lib/post/ui/Timer";
import { MoreButton } from "~/lib/post/ui/MoreButton";

type Props = {
  post: SerializedPost;
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
    <article className={`${displayFull ? "w-full h-full flex flex-col" : ""}`}>
      {asLink ? (
        <Link
          className="block text-slate-900 hover:no-underline dark:text-slate-50"
          to={`/posts/${post.id}`}
        >
          <p className="text-lg whitespace-pre-wrap">{post.content}</p>
        </Link>
      ) : (
        <p
          className={`text-lg whitespace-pre-wrap ${
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
          <ProfileLink userId={post.userId!} displayName={post.createdBy!} />
        </div>
        <div className="flex items-center justify-between mt-3 sm:mt-0 sm:gap-1">
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
