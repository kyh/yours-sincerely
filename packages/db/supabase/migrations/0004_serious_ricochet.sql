-- Stop the Feed and UserStats views from full-scanning on every request.
--
-- BEFORE (7.8k posts, 40k likes, 400 flags, seeded locally):
--   Feed page 1      13.99 ms, 1189 shared buffers
--                    Seq Scan "Like" (40000) -> HashAggregate
--                    Seq Scan "Post" (7861)  -> HashAggregate
--                    Seq Scan "Flag" (400)   -> HashAggregate, then TWO sorts
--   UserStats 1 user 14.16 ms, 629 shared buffers
--                    WindowAgg over every post of every user, then filter to one
--
-- Neither cost depended on how much was asked for: page 50 cost the same as page
-- 1, and UserStats fires on profile-link HOVER.
--
-- The fix is to maintain the counts incrementally on "Post", and to parameterize
-- UserStats so the userId predicate runs BEFORE the CTEs instead of after.

DROP VIEW "public"."UserStats";--> statement-breakpoint
DROP VIEW "public"."Feed";--> statement-breakpoint

ALTER TABLE "Post" ADD COLUMN "likeCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "commentCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "flagCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Backfill BEFORE the triggers exist, so nothing is double counted.
--
-- NOTE "flagCount" counts ONLY flags with "countsTowardHide" (migration 0003).
-- A raw COUNT(*) here would silently revert that migration's security fix and
-- re-open the four-cookieless-requests censorship hole. This is the single most
-- dangerous line in the file.
UPDATE "public"."Post" p SET
  "likeCount"    = (SELECT COUNT(*) FROM "public"."Like" l WHERE l."postId"   = p."id"),
  "flagCount"    = (SELECT COUNT(*) FROM "public"."Flag" f WHERE f."postId"   = p."id" AND f."countsTowardHide"),
  "commentCount" = (SELECT COUNT(*) FROM "public"."Post" c WHERE c."parentId" = p."id");--> statement-breakpoint

-- Row-level triggers, so bulk deletes (deletePost / deleteUser cascade through
-- collectDescendantPostIds and delete many rows in ONE statement) are handled a
-- row at a time. When the parent post is deleted in the same statement as its
-- children, the child's decrement simply matches zero rows — the parent is
-- already gone — which is correct, not drift.
CREATE OR REPLACE FUNCTION public."syncPostLikeCount"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public."Post" SET "likeCount" = "likeCount" + 1 WHERE "id" = NEW."postId";
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public."Post" SET "likeCount" = GREATEST("likeCount" - 1, 0) WHERE "id" = OLD."postId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;--> statement-breakpoint

-- Only flags that carry moderation authority move this counter. `countsTowardHide`
-- is frozen at insert time by migration 0003's trigger, so the UPDATE branch is
-- belt-and-braces: nothing in the app rewrites it.
CREATE OR REPLACE FUNCTION public."syncPostFlagCount"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW."countsTowardHide" THEN
      UPDATE public."Post" SET "flagCount" = "flagCount" + 1 WHERE "id" = NEW."postId";
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD."countsTowardHide" THEN
      UPDATE public."Post" SET "flagCount" = GREATEST("flagCount" - 1, 0) WHERE "id" = OLD."postId";
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD."countsTowardHide" IS DISTINCT FROM NEW."countsTowardHide" THEN
      IF NEW."countsTowardHide" THEN
        UPDATE public."Post" SET "flagCount" = "flagCount" + 1 WHERE "id" = NEW."postId";
      ELSE
        UPDATE public."Post" SET "flagCount" = GREATEST("flagCount" - 1, 0) WHERE "id" = NEW."postId";
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public."syncPostCommentCount"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW."parentId" IS NOT NULL THEN
      UPDATE public."Post" SET "commentCount" = "commentCount" + 1 WHERE "id" = NEW."parentId";
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD."parentId" IS NOT NULL THEN
      UPDATE public."Post" SET "commentCount" = GREATEST("commentCount" - 1, 0) WHERE "id" = OLD."parentId";
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD."parentId" IS DISTINCT FROM NEW."parentId" THEN
      IF OLD."parentId" IS NOT NULL THEN
        UPDATE public."Post" SET "commentCount" = GREATEST("commentCount" - 1, 0) WHERE "id" = OLD."parentId";
      END IF;
      IF NEW."parentId" IS NOT NULL THEN
        UPDATE public."Post" SET "commentCount" = "commentCount" + 1 WHERE "id" = NEW."parentId";
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "like_sync_post_count" ON "public"."Like";--> statement-breakpoint
CREATE TRIGGER "like_sync_post_count"
  AFTER INSERT OR DELETE ON "public"."Like"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostLikeCount"();--> statement-breakpoint

DROP TRIGGER IF EXISTS "flag_sync_post_count" ON "public"."Flag";--> statement-breakpoint
CREATE TRIGGER "flag_sync_post_count"
  AFTER INSERT OR DELETE OR UPDATE ON "public"."Flag"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostFlagCount"();--> statement-breakpoint

DROP TRIGGER IF EXISTS "post_sync_comment_count" ON "public"."Post";--> statement-breakpoint
CREATE TRIGGER "post_sync_comment_count"
  AFTER INSERT OR DELETE OR UPDATE ON "public"."Post"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostCommentCount"();--> statement-breakpoint

CREATE INDEX "Post_feed_idx" ON "Post" USING btree ("createdAt" timestamp_ops,"id" text_ops) WHERE "parentId" IS NULL;--> statement-breakpoint
CREATE INDEX "Post_userId_createdAt_idx" ON "Post" USING btree ("userId" text_ops,"createdAt" timestamp_ops);--> statement-breakpoint

-- NOTE: "Post_id_userId_idx" is led by the primary key, so it can never be more
-- selective than the PK — it is pure write overhead. It is NOT dropped here: on a
-- fresh local database every index reports idx_scan = 0, which proves nothing.
-- Drop it only after checking pg_stat_user_indexes against production.

-- The feed is now a projection. No CTE, no joins, no aggregation, and no ORDER BY
-- (getFeed orders; the view's own ORDER BY forced the window to be sorted twice).
-- `flagCount <= 3` is exactly the old `HAVING COUNT(*) > 3` exclusion, over the
-- established-flagger rule from migration 0003.
CREATE VIEW "public"."Feed" WITH (security_invoker = true) AS (SELECT p.id, p.content, p."userId", p."createdAt", p."parentId", p."createdBy", COALESCE(p."baseLikeCount", 0) + p."likeCount" AS "likeCount", p."commentCount" AS "commentCount" FROM "Post" p WHERE p."flagCount" <= 3 AND p."createdAt" >= (CURRENT_DATE - '21 days'::interval) AND p."parentId" IS NULL);--> statement-breakpoint

-- UserStats, parameterized. The streak logic is a VERBATIM port of the view's
-- gap-and-island (post_date minus row_number) — it is what users see on their
-- profile and it is not worth rewriting from scratch. The only change is WHERE
-- the userId predicate runs: first, instead of after every user's streaks have
-- been computed and materialized.
--
-- Deliberately NO `SET search_path` here, unlike the trigger functions above.
-- A SET clause makes a function un-inlinable, and an un-inlined SQL function is
-- planned blind: measured at 1.7-2.0 ms / 1056 buffers with the SET, versus
-- 0.55-0.77 ms / 151 buffers without it, on the same row. The usual reason to
-- pin search_path is to stop an attacker hijacking an unqualified name inside a
-- SECURITY DEFINER function — this one is SECURITY INVOKER (it runs with the
-- caller's own rights, so there is no privilege to escalate) and every object it
-- touches is schema-qualified. Do NOT add a SET clause here without re-measuring.
CREATE OR REPLACE FUNCTION public."getUserStats"(target_user_id text)
RETURNS TABLE (
  "userId" text,
  "displayName" text,
  "totalPostCount" bigint,
  "totalLikeCount" numeric,
  "longestPostStreak" bigint,
  "currentPostStreak" bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH daily_posts AS (
    SELECT DATE(p."createdAt") AS post_date
    FROM public."Post" p
    WHERE p."userId" = target_user_id
    GROUP BY DATE(p."createdAt")
  ),
  streaks AS (
    SELECT
      post_date,
      post_date - (ROW_NUMBER() OVER (ORDER BY post_date))::integer AS streak_group
    FROM daily_posts
  ),
  streak_lengths AS (
    SELECT
      streak_group,
      COUNT(*) AS streak_length,
      MAX(post_date) AS streak_end
    FROM streaks
    GROUP BY streak_group
  ),
  post_likes AS (
    SELECT COALESCE(p."baseLikeCount", 0) + COUNT(l."userId") AS total_likes
    FROM public."Post" p
    LEFT JOIN public."Like" l ON p."id" = l."postId"
    WHERE p."userId" = target_user_id
    GROUP BY p."id", p."baseLikeCount"
  )
  SELECT
    u."id",
    u."displayName",
    COALESCE((SELECT COUNT(*) FROM public."Post" p WHERE p."userId" = target_user_id), 0)::bigint,
    COALESCE((SELECT SUM(total_likes) FROM post_likes), 0)::numeric,
    COALESCE((SELECT MAX(streak_length) FROM streak_lengths), 0)::bigint,
    COALESCE(
      (
        SELECT sl2.streak_length
        FROM streak_lengths sl2
        WHERE sl2.streak_end = (SELECT MAX(sl3.streak_end) FROM streak_lengths sl3)
      ),
      0
    )::bigint
  FROM public."User" u
  WHERE u."id" = target_user_id;
$$;
