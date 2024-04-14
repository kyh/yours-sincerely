import type { Post as PrismaPost } from "@prisma/client";
// import type { SerializeObject } from "@trpc/server/shared";

export type Post = Partial<PrismaPost> & {
  createdBy?: string | null;
  likeCount?: number | null;
  isLiked?: boolean | null;
  commentCount?: number | null;
  comments?: Post[];
};

// export type SerializedPost = SerializeObject<Post>;

export const POST_EXPIRY_DAYS_AGO = 21;

export const isPostContentValid = (content?: string): content is string => {
  return !!content && content.length > 10;
};
