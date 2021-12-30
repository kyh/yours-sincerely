import { Post as PrismaPost } from "@prisma/client";

export type Post = Partial<PrismaPost> & {
  _createdBy?: string;
  _likeCount?: number;
  _isLiked?: boolean;
};

export const POST_EXPIRY_DAYS_AGO = 21;
