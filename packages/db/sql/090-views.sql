-- Views live here, NOT in `drizzle-schema.ts`, because `drizzle-kit push` does not
-- diff a view's body. It creates a view that is missing and drops one that was
-- deleted from the schema file, but for a view whose name already exists it emits
-- nothing at all — however much the SELECT changed. Verified against a
-- production-shaped database: push applied every ADD COLUMN and CREATE INDEX,
-- dropped the removed `UserStats`, and left a rewritten `Feed` untouched, exit 0,
-- no warning.
--
-- `drizzle-schema.ts` declares `feed` with `.existing()` so push keeps its hands
-- off. The column list there and the SELECT here must agree; nothing enforces that
-- but `post-feed.integration.ts`.
--
-- DROP then CREATE, rather than CREATE OR REPLACE: replace cannot change a
-- column's type or order, and this view's counts went from bigint aggregates to
-- integer columns. Replace would fail; drop-and-create always converges.
--
-- Dropping a view readers are using sounds alarming and is not, because
-- `apply-sql.ts` runs every file in ONE transaction. DROP VIEW takes an ACCESS
-- EXCLUSIVE lock, so concurrent readers block until the transaction commits and
-- then see the new view. Nobody ever observes a missing `Feed`.
--
-- THIS FILE RUNS LAST, AND THAT IS THE WHOLE POINT OF ITS NUMBER.
--
-- The ACCESS EXCLUSIVE lock is taken at the DROP and held until COMMIT, so every
-- statement that runs after it is time a feed reader spends blocked. This file
-- sorted as `050-` at first, ahead of the reconcile — which measured 2.1s of
-- ground-truth computation against production (166k posts, 143k likes) before the
-- 166k-row UPDATE even begins. That would have blocked every feed read for the
-- whole reconcile. Invisible on the 7.8k-post fixture; a visible stall on real
-- data. Nothing may be added after this file that is not O(1).
--
-- Running last is safe because the OLD `Feed` stays correct right up to the swap:
-- `drizzle-kit push` adds `Post."likeCount"` and friends beforehand, defaulted to
-- 0 and maintained by nothing yet, but the old view does not read those columns —
-- it aggregates live. So the reconcile can take its time, and this file then swaps
-- the view in atomically over counters that are already correct. There is no
-- instant at which a reader sees the new view over unreconciled counters, and so
-- no window of zeroed like counts.
--
-- The reconcile does NOT block readers on its own: it takes row locks on "Post",
-- and MVCC means a SELECT never waits on those.

DROP VIEW IF EXISTS "public"."Feed";

-- A plain filtered projection: no CTE, no joins, no aggregation. It used to
-- hash-aggregate ALL of "Like", ALL of "Post" and ALL of "Flag" to return five
-- letters, on every page of every request — 13.99 ms and 1189 shared buffers on
-- the seeded fixture, and page 50 cost exactly what page 1 cost. The counters on
-- "Post" do that work incrementally instead.
--
-- `flagCount <= 3` is exactly the old `HAVING COUNT(*) > 3` exclusion, except over
-- the established-flagger rule in `010-flagger.sql` rather than raw Flag rows.
-- Reverting it to a raw count re-opens the four-cookieless-requests censorship
-- hole; `FLAG_HIDE_THRESHOLD` in `packages/api/src/post/post-utils.ts` mirrors the
-- 3 for the permalink path.
--
-- Deliberately NO `ORDER BY`: `getFeed` orders, and the view's own ORDER BY forced
-- the whole window to be sorted a second time. `Post_feed_idx` serves the ordering
-- getFeed asks for.
--
-- `security_invoker` so the view executes as its caller and not as its owner.
CREATE VIEW "public"."Feed" WITH (security_invoker = true) AS
SELECT
  p."id",
  p."content",
  p."userId",
  p."createdAt",
  p."parentId",
  -- COALESCE so `feed.createdBy`'s `.notNull()` is true by construction rather
  -- than by luck. `Post."createdBy"` is nullable and 201 legacy rows are in fact
  -- null; `createPost` has since defaulted it to 'Anonymous', and none of the 201
  -- is inside the 21-day window, so the lie is currently unreachable — but it is
  -- still a lie, and it is the same one this schema just fixed for `parentId`.
  --
  -- 'Anonymous' rather than '' because that is exactly what the permalink already
  -- shows: `convertDbPostToFeedPost` does `dbPost.createdBy || "Anonymous"`.
  -- `getFeed` spreads raw view rows onto the wire without that coalesce, so doing
  -- it here is what keeps the feed and the permalink telling the same story about
  -- the same letter.
  COALESCE(p."createdBy", 'Anonymous') AS "createdBy",
  COALESCE(p."baseLikeCount", 0) + p."likeCount" AS "likeCount",
  p."commentCount" AS "commentCount"
FROM "public"."Post" p
WHERE p."flagCount" <= 3
  AND p."createdAt" >= (CURRENT_DATE - '21 days'::interval)
  AND p."parentId" IS NULL;
