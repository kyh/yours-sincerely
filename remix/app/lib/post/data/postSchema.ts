import { Post as PrismaPost, Like as PrismaLike } from "@prisma/client";

export type Like = PrismaLike;

export type Post = Partial<PrismaPost> & {
  createdBy?: string;
  likeCount?: number;
  isLiked?: boolean;
  commentCount?: number;
};

export const POST_EXPIRY_DAYS_AGO = 21;
