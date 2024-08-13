import type { Database } from "@init/db/database.types";

export const POST_EXPIRY_DAYS_AGO = 21;

export const isPostContentValid = (content?: string): content is string => {
  return !!content && content.length > 10;
};

type Post = Database["public"]["Tables"]["Post"]["Row"];
type Like = Database["public"]["Tables"]["Like"]["Row"];
type Flag = Database["public"]["Tables"]["Flag"]["Row"];

export const formatPost = (
  post: Post & {
    comments?: Post[] | null;
    likes?: Like[] | null;
    flags?: Flag[] | null;
  },
) => {
  const formatted = {
    ...post,
    createdBy: post.createdBy ?? "Anonymous",
    commentCount: post.comments?.length ?? 0,
    likeCount: (post.baseLikeCount ?? 0) + (post.likes?.length ?? 0),
    isLiked: post.likes ? !!post.likes.length : false,
  };

  if (formatted.comments) {
    const comments = formatted.comments;
    formatted.comments = comments.map((c) => formatPost(c));
  }

  return formatted;
};
