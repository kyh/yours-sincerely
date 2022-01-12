import { Post } from "~/lib/post/data/postSchema";
import { ProfileLink } from "~/lib/core/ui/ProfileLink";

type Props = {
  post: Post;
};

export const CommentContent = ({ post }: Props) => {
  return (
    <article>
      <ProfileLink
        className="mr-1 text-sm"
        userId={post.userId!}
        displayName={post.createdBy!}
      />
      <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
    </article>
  );
};
