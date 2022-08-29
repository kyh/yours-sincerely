import type { SerializedPost } from "~/lib/post/data/postSchema";
import { ProfileLink } from "~/lib/core/ui/ProfileLink";
import { MoreButton } from "~/lib/post/ui/MoreButton";

type Props = {
  post: SerializedPost;
};

export const CommentContent = ({ post }: Props) => {
  return (
    <article>
      <header className="flex text-sm items-center justify-between">
        <ProfileLink userId={post.userId!} displayName={post.createdBy!} />
        <MoreButton post={post} />
      </header>
      <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
    </article>
  );
};
