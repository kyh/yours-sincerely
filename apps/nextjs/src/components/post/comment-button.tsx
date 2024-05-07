import Link from "next/link";

import type { Post } from "@init/api/lib/post-schema";
import { iconAttrs } from "@/app/_components/icon";

type Props = {
  post: Post;
};

export const CommentButton = ({ post }: Props) => {
  return (
    <Link
      className="relative flex items-center gap-2 rounded-lg p-2 text-inherit transition hover:bg-slate-100 hover:no-underline dark:hover:bg-slate-700"
      href={`/posts/${post.id}`}
    >
      <svg {...iconAttrs} strokeWidth="3" className="text-slate-400">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span className="min-w-[0.75rem]">
        {post.commentCount ?? 0}
        <span className="sr-only"> comments, click to see details</span>
      </span>
    </Link>
  );
};

export default CommentButton;
