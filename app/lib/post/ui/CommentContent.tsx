import { Link } from "remix";
import { Post } from "~/lib/post/data/postSchema";
import { LikeButton } from "~/lib/post/ui/LikeButton";
import { MoreButton } from "~/lib/post/ui/MoreButton";

type Props = {
  post: Post;
};

export const CommentContent = ({ post }: Props) => {
  return (
    <article>
      <Link
        className="inline-flex mr-1 underline text-slate-900 underline-offset-2 decoration-dotted dark:text-slate-50"
        to={`/${post.userId}`}
      >
        {post.createdBy}:
      </Link>
      <p className="inline-flex whitespace-pre-wrap">{post.content}</p>
      <footer className="flex items-center justify-end gap-1 mt-1">
        <LikeButton post={post} />
        <MoreButton post={post} />
      </footer>
    </article>
  );
};
