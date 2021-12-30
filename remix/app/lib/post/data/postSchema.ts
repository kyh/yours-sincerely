import { Post as PrismaPost } from "@prisma/client";

export type Post = Partial<PrismaPost>;

export const POST_EXPIRY_DAYS_AGO = 21;
