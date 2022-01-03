import { Post as PrismaPost } from "@prisma/client";

export type Post = Partial<PrismaPost> & {
  createdBy?: string | null;
  likeCount?: number | null;
  isLiked?: boolean | null;
  commentCount?: number | null;
};

export const POST_EXPIRY_DAYS_AGO = 21;
