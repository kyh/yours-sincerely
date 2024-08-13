import type { RouterOutputs } from "@init/api";
import { ProfileLink } from "@/app/(app)/profile/_components/profile-link";
import { MoreButton } from "./more-button";

type Props = {
  post: RouterOutputs["post"]["byId"];
};

export const CommentContent = ({ post }: Props) => {
  return (
    <article>
      <header className="flex items-center justify-between text-sm">
        {post.userId && post.createdBy && (
          <ProfileLink userId={post.userId} displayName={post.createdBy} />
        )}
        <MoreButton post={post} />
      </header>
      <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
    </article>
  );
};
