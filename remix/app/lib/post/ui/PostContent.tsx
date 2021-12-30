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
        <Link className="text-slate-900 hover:no-underline" to={`/${post.id}`}>
          <p className="text-lg">{post.content}</p>
        </Link>
      ) : (
        <p className="text-lg">{post.content}</p>
      )}
      <footer className="flex items-center justify-between mt-4">
        <div className="before:content-['—_'] inline-block mr-1 align-[1px] italic">
          {post._createdBy}
        </div>
        <div className="flex items-center gap-1">
          {showShare && <ShareButton post={post} />}
          {showLike && <LikeButton post={post} />}
          {showTimer && <Timer post={post} />}
          {showMore && <MoreButton post={post} />}
        </div>
      </footer>
    </article>
  );
};