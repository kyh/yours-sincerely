import { ProfileLink } from "@/app/_components/profilelink";
import type { Post } from "../data/postschema";
import { MoreButton } from "./morebutton";

type Props = {
  post: Post;
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
