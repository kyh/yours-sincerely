import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";

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
      <MessageCircleIcon className="size-4" />
      <span className="min-w-[0.75rem]">
        {post.commentCount}
        <span className="sr-only"> comments, click to see details</span>
      </span>
    </Link>
  );
};

export default CommentButton;
