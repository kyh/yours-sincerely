import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { MessageCircleIcon } from "lucide-react";

import type { RouterOutputs } from "@repo/api";

type Props = {
  post: RouterOutputs["post"]["getFeed"]["posts"][0];
};

export const CommentButton = ({ post }: Props) => {
  return (
    <Link
      className="hover:bg-accent relative flex h-8 items-center gap-1.5 rounded-lg p-2 transition"
      href={`/posts/${post.id}`}
    >
      <MessageCircleIcon className="size-4" />
      <span className="min-w-[0.75rem]">
        <NumberFlow value={post.commentCount} />
        <span className="sr-only"> comments, click to see details</span>
      </span>
    </Link>
  );
};

export default CommentButton;
