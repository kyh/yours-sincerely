import { ProfileLink } from "~/components/ProfileLink";
import type { SerializedPost } from "~/lib/post/data/postSchema";
import { MoreButton } from "~/lib/post/ui/MoreButton";

type Props = {
  post: SerializedPost;
};

export const CommentContent = ({ post }: Props) => {
  return (
    <article>
      <header className="flex items-center justify-between text-sm">
        <ProfileLink userId={post.userId!} displayName={post.createdBy!} />
        <MoreButton post={post} />
      </header>
      <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
    </article>
  );
};
