import { inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { post } from "@repo/db/drizzle-schema";

export { POST_EXPIRY_DAYS as POST_EXPIRY_DAYS_AGO } from "@repo/contracts/content";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The given posts plus every descendant comment, breadth-first and
    cycle-safe. Callers cascade-delete likes/flags/posts with the result —
    the schema has no ON DELETE CASCADE on Post.parentId. */
export const collectDescendantPostIds = async (tx: Tx, rootIds: string[]) => {
  const collected = new Set(rootIds);
  let parentIds = rootIds;

  while (parentIds.length > 0) {
    const children = await tx
      .select({ id: post.id })
      .from(post)
      .where(inArray(post.parentId, parentIds));
    parentIds = children.map((child) => child.id).filter((childId) => !collected.has(childId));
    parentIds.forEach((childId) => collected.add(childId));
  }

  return [...collected];
};
