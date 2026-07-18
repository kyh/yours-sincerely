import { inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { post } from "@repo/db/drizzle-schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** More than this many COUNTING flags auto-hides a post. Mirrors the `HAVING
    count(*) > 3` in the Feed view's `flagged_posts` CTE. */
export const FLAG_HIDE_THRESHOLD = 3;

/** Whether the community has flagged this post into hiding.
 *
 *  `Post.flagCount` is THE count of flags that count, and it is maintained in
 *  exactly one place: the `syncPostFlagCount` trigger (`sql/085-triggers.sql`), which
 *  moves it only for flags whose `Flag.countsTowardHide` the `isEstablishedFlagger`
 *  function (`sql/010-flagger.sql`) already decided. The Feed view's `flagCount <= 3`
 *  reads the same column.
 *
 *  So "a flag that counts" has one definition, in one place, and SQL and
 *  TypeScript cannot drift apart on it — which they have already done once in
 *  this schema. Re-deriving "established" here from `User.email`/`User.createdAt`
 *  would recreate that risk and re-open the censorship hole the moment the two
 *  disagreed, and counting raw `Flag` rows would re-open it immediately. */
export const isFlaggedIntoHiding = (flagCount: number): boolean => flagCount > FLAG_HIDE_THRESHOLD;

/** How far back `getPostsByUser` will look. It is a public endpoint, so it must
    not be an unbounded scan of one user's whole history. The widest grid any
    client renders is 200 days (`createPostsHeatmap(posts, isDesktop ? 200 : 120)`),
    so 400 is double the deepest thing that is drawn.

    NOTE: expiry is deliberately NOT applied here — the profile heatmap counts
    expired posts on purpose, or streaks would retroactively erase themselves. */
export const POST_HISTORY_WINDOW_DAYS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The oldest `createdAt` `getPostsByUser` will return, as a Postgres
    `timestamp`-comparable ISO string (the column is `mode: "string"`). */
export const getPostHistoryFloor = (now: Date = new Date()): string =>
  new Date(now.getTime() - POST_HISTORY_WINDOW_DAYS * DAY_MS).toISOString();

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
