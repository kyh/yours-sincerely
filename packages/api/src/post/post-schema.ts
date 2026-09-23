import type { WirePost } from "@repo/contracts/post-contract";
import { resolveDisplayName } from "@repo/contracts/user";
import type { post } from "@repo/db/drizzle-schema";

type DbPost = typeof post.$inferSelect;

interface ConvertOptions {
  isLiked: boolean;
  /** Explicit, because the two callers legitimately differ: a post's own
      `commentCount` column counts ALL children, while `getPost` reports the
      comments it actually returns (hidden ones are filtered out first). */
  commentCount: number;
  comments?: WirePost[];
}

/** Reads the denormalized counters (`sql/085-triggers.sql`) instead of counting loaded
    rows. `getPost` used to load every `Like` and `Flag` row for a post AND each
    of its comments purely to derive two integers and a boolean — a popular
    letter shipped thousands of rows to Node to do it. */
export const convertDbPostToFeedPost = (dbPost: DbPost, options: ConvertOptions): WirePost => ({
  commentCount: options.commentCount,
  comments: options.comments,
  content: dbPost.content,
  createdAt: dbPost.createdAt,
  createdBy: resolveDisplayName(dbPost.createdBy),
  id: dbPost.id,
  isLiked: options.isLiked,
  likeCount: (dbPost.baseLikeCount ?? 0) + dbPost.likeCount,
  parentId: dbPost.parentId || "",
  userId: dbPost.userId,
});
