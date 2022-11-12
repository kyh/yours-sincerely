import { Link } from "@remix-run/react";
import { iconAttrs } from "~/lib/core/ui/Icon";
import type { SerializedPost } from "~/lib/post/data/postSchema";

type Props = {
  post: SerializedPost;
};

export const CommentButton = ({ post }: Props) => {
  return (
    <Link
      className="relative flex items-center gap-2 p-2 transition rounded-lg text-inherit hover:no-underline hover:bg-slate-100 dark:hover:bg-slate-700"
      to={`/posts/${post.id}`}
    >
      <svg {...iconAttrs} strokeWidth="3" className="text-slate-400">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span className="min-w-[0.75rem]">{post.commentCount || 0}</span>
    </Link>
  );
};

export default CommentButton;
