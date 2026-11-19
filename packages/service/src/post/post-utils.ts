import { and, eq, lte, notExists, sql } from "@repo/db";
import type { Db } from "@repo/db/drizzle-client";
import { block } from "@repo/db/drizzle-schema";
import type { AnyColumn } from "drizzle-orm";

/** More than this many COUNTING flags auto-hides a post. Mirrors the literal
    `flagCount <= 3` in the Feed view (`sql/090-views.sql`), which cannot import it. */
export const FLAG_HIDE_THRESHOLD = 3;

// WARNING: Post.flagCount is the one definition of a flag that counts; never re-derive "established" or count raw Flag rows here.
const visibleByFlags = (flagCount: AnyColumn) => lte(flagCount, FLAG_HIDE_THRESHOLD);

/** The viewer has not blocked this author. A correlated NOT EXISTS rather than
    the viewer's whole block list fetched on a separate round-trip and passed back
    down as a literal array. No viewer, no blocks, no filter. */
export const notBlockedBy = (database: Db, viewerId: string | undefined, authorId: AnyColumn) =>
  viewerId === undefined
    ? undefined
    : notExists(
        database
          .select({ blocked: sql`1` })
          .from(block)
          .where(and(eq(block.blockerId, viewerId), eq(block.blockingId, authorId))),
      );

/** Whether `post.getPost` would serve this post to this viewer. Every read that
    shows or points at a post applies this one rule, so a notification can never
    lead to a letter that answers NOT_FOUND.

    Expiry is deliberately NOT part of it: a letter leaves the feed after 21 days
    but stays readable at its permalink. Share links do not die. */
export const postVisibleTo = (
  database: Db,
  viewerId: string | undefined,
  row: { flagCount: AnyColumn; userId: AnyColumn },
) => {
  const unflagged = visibleByFlags(row.flagCount);

  return and(unflagged, notBlockedBy(database, viewerId, row.userId)) ?? unflagged;
};

/** How far back `getPostsByUser` will look. It is a public endpoint, so it must
    not be an unbounded scan of one user's whole history. The widest grid any
    client renders is `HEATMAP_DAYS.wide` (200 days, `@repo/contract/calendar`),
    so 400 is double the deepest thing that is drawn; `post-utils.test.ts` fails
    if it ever drops below that grid.

    NOTE: expiry is deliberately NOT applied here — the profile heatmap counts
    expired posts on purpose, or streaks would retroactively erase themselves. */
export const POST_HISTORY_WINDOW_DAYS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The oldest `createdAt` `getPostsByUser` will return, as a Postgres
    `timestamp`-comparable ISO string (the column is `mode: "string"`). */
export const getPostHistoryFloor = (now: Date = new Date()) =>
  new Date(now.getTime() - POST_HISTORY_WINDOW_DAYS * DAY_MS).toISOString();
