-- Close the flag-censorship path.
--
-- The ONLY moderation mechanism in the product is auto-hide at >3 flags. Flag's
-- primary key is (postId, userId), which looks like it stops one person flagging
-- four times — except an identity costs one cookieless request, so discarding
-- the cookie between calls hid ANY post in the app with four requests.
--
-- Anyone may still SUBMIT a flag (the row is recorded, for a future moderation
-- queue). What changes is that a brand-new identity no longer carries moderation
-- AUTHORITY. Keep writing cheap; make judging expensive.
--
-- `isEstablishedFlagger` below is THE definition of "a flag that counts". It is
-- evaluated once, at insert time, and frozen into Flag."countsTowardHide". Every
-- other place that asks "is this post hidden?" — the Feed view, getPost, and
-- (from migration 0004) Post."flagCount" — reads that boolean and nothing else.
-- There is deliberately no second copy of this rule anywhere.

DROP VIEW "public"."Feed";--> statement-breakpoint
ALTER TABLE "Flag" ADD COLUMN "countsTowardHide" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- An identity has moderation authority if it is registered, or if it is an
-- anonymous identity that is at least a day old AND has actually written
-- something. Both halves matter: age alone is free to wait out, and a post alone
-- is free to mint.
CREATE OR REPLACE FUNCTION public."isEstablishedFlagger"(flagger_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u."id" = flagger_id
      AND (
        u."email" IS NOT NULL
        OR (
          u."createdAt" <= NOW() - INTERVAL '24 hours'
          AND EXISTS (SELECT 1 FROM public."Post" p WHERE p."userId" = u."id")
        )
      )
  );
$$;--> statement-breakpoint

-- Frozen at insert time, never written by the application.
CREATE OR REPLACE FUNCTION public."setFlagCountsTowardHide"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW."countsTowardHide" := public."isEstablishedFlagger"(NEW."userId");
  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "flag_counts_toward_hide" ON "public"."Flag";--> statement-breakpoint
CREATE TRIGGER "flag_counts_toward_hide"
  BEFORE INSERT ON "public"."Flag"
  FOR EACH ROW
  EXECUTE FUNCTION public."setFlagCountsTowardHide"();--> statement-breakpoint

-- Backfill: existing flags are judged by the same rule, as of now.
UPDATE "public"."Flag" f
SET "countsTowardHide" = public."isEstablishedFlagger"(f."userId");--> statement-breakpoint

CREATE VIEW "public"."Feed" WITH (security_invoker = true) AS (WITH flagged_posts AS ( SELECT "Flag"."postId" FROM "Flag" WHERE "Flag"."countsTowardHide" GROUP BY "Flag"."postId" HAVING count(*) > 3 ) SELECT p.id, p.content, p."userId", p."createdAt", p."parentId", p."createdBy", COALESCE(p."baseLikeCount", 0) + COALESCE(l.like_count, 0::bigint) AS "likeCount", COALESCE(c.comment_count, 0::bigint) AS "commentCount" FROM "Post" p LEFT JOIN ( SELECT "Like"."postId", count(*) AS like_count FROM "Like" GROUP BY "Like"."postId") l ON p.id = l."postId" LEFT JOIN ( SELECT "Post"."parentId", count(*) AS comment_count FROM "Post" GROUP BY "Post"."parentId") c ON p.id = c."parentId" WHERE NOT (p.id IN ( SELECT flagged_posts."postId" FROM flagged_posts)) AND p."createdAt" >= (CURRENT_DATE - '21 days'::interval) AND p."parentId" IS NULL ORDER BY p."createdAt" DESC);
