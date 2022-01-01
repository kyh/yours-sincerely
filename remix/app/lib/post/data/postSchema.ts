import { Post as PrismaPost } from "@prisma/client";

export type Post = Partial<PrismaPost> & {
  createdBy?: string;
  likeCount?: number;
  isLiked?: boolean;
  commentCount?: number;
};

export const POST_EXPIRY_DAYS_AGO = 21;
