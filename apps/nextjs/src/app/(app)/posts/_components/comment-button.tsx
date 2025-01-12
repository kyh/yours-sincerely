import Link from "next/link";

import type { RouterOutputs } from "@init/api";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const CommentButton = ({ post }: Props) => {
  return (
    <Link
      className="relative flex h-8 items-center gap-1.5 rounded-lg p-2 transition hover:bg-accent"
      href={`/posts/${post.id}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="-translate-y-px"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
      <span className="min-w-[0.75rem]">
        {post.commentCount}
        <span className="sr-only"> comments, click to see details</span>
      </span>
    </Link>
  );
};

export default CommentButton;
