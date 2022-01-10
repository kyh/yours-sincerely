import { Link } from "remix";
import { Post } from "~/lib/post/data/postSchema";
import { ShareButton } from "~/lib/post/ui/ShareButton";
import { LikeButton } from "~/lib/post/ui/LikeButton";
import { Timer } from "~/lib/post/ui/Timer";
import { MoreButton } from "~/lib/post/ui/MoreButton";

type Props = {
  post: Post;
  showLink?: boolean;
  showShare?: boolean;
  showLike?: boolean;
  showTimer?: boolean;
  showMore?: boolean;
};

export const PostContent = ({
  post,
  showLink = true,
  showShare = true,
  showLike = true,
  showTimer = true,
  showMore = false,
}: Props) => {
  return (
    <article>
      {showLink ? (
        <Link
          className="text-slate-900 hover:no-underline dark:text-slate-50"
          to={`/posts/${post.id}`}
        >
          <p className="text-lg whitespace-pre-wrap">{post.content}</p>
        </Link>
      ) : (
        <p className="text-lg whitespace-pre-wrap">{post.content}</p>
      )}
      <footer className="flex items-center justify-between mt-4">
        <div className="italic">
          <span className="inline-flex mr-1 align-[1px]">Yours Sincerely,</span>
          <Link
            className="inline-flex text-slate-900 underline underline-offset-2 decoration-dotted dark:text-slate-50"
            to={`/${post.userId}`}
          >
            {post.createdBy}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {showLike && <LikeButton post={post} />}
          {showTimer && <Timer post={post} />}
          {showShare && <ShareButton post={post} />}
          {showMore && <MoreButton post={post} />}
        </div>
      </footer>
    </article>
  );
};
