import type { Post } from "@init/api/lib/post-schema";
import { ProfileLink } from "@/components/profile/profile-link";
import { MoreButton } from "./more-button";

type Props = {
  post: Post;
};

export const CommentContent = ({ post }: Props) => {
  return (
    <article>
      <header className="flex items-center justify-between text-sm">
        <ProfileLink userId={post.userId} displayName={post.createdBy} />
        <MoreButton post={post} />
      </header>
      <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
    </article>
  );
};
