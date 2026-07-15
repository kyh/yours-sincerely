-- The only file here that touches data. It runs on EVERY push, so every statement
-- is written to be a no-op once the database is already correct.
--
-- Two jobs: judge flags that have never been judged, and repair counter drift.

---------------------------------------------------------------------------------
-- 1. Judge unjudged flags.
---------------------------------------------------------------------------------
-- `Flag."countsTowardHide"` is NULLABLE, and that is load-bearing:
--
--     NULL  = not yet judged
--     true  = judged, carries moderation authority, FROZEN
--     false = judged, does not carry authority, FROZEN
--
-- The three-state column is what makes this file safe to re-run. The obvious
-- design — `boolean NOT NULL DEFAULT false` plus `UPDATE "Flag" SET
-- "countsTowardHide" = "isEstablishedFlagger"("userId")` — is idempotent in the
-- trivial sense (run it twice, same result) and WRONG here, because
-- `isEstablishedFlagger` depends on wall-clock age. A flag cast by a then-new
-- account would be re-judged on some later, unrelated push and could flip
-- false -> true, hiding a post that was not hidden before. Deploying a typo fix
-- would silently change moderation state.
--
-- `010-flagger.sql` freezes the decision at insert time precisely to avoid that.
-- `WHERE "countsTowardHide" IS NULL` is what preserves the freeze: after the first
-- run there are no NULLs, so this is a permanent no-op, and the only rows it can
-- ever touch are ones no decision has been made about yet.
--
-- It stays reachable rather than becoming dead code because of the deploy window:
-- `drizzle-kit push` adds the column before `030-triggers.sql` attaches the
-- BEFORE INSERT trigger, so a flag landing in those few seconds gets NULL. This
-- judges it, seconds late, which is the correct answer anyway.
UPDATE public."Flag" f
SET "countsTowardHide" = public."isEstablishedFlagger"(f."userId")
WHERE f."countsTowardHide" IS NULL;

---------------------------------------------------------------------------------
-- 2. Repair counter drift.
---------------------------------------------------------------------------------
-- Recomputed from ground truth — the actual Like / Flag / child-Post rows — so it
-- is absolute, not incremental, and therefore self-correcting no matter how the
-- counters got wrong. This is why correcting drift is `pnpm -F db push`, and why
-- there is no separate drift-check script to remember to run.
--
-- `flagCount` counts ONLY flags with `countsTowardHide IS TRUE`. A raw COUNT(*)
-- here would silently revert the censorship fix in `010-flagger.sql` and re-open
-- the four-cookieless-requests hole. This is the most dangerous line in the file.
--
-- The IS DISTINCT FROM guard makes the steady state genuinely free: a push against
-- a correct database updates ZERO rows. Without it every push would rewrite every
-- Post row, producing dead tuples and vacuum churn proportional to the table on
-- each deploy, forever.
--
-- Racing with the triggers is benign. A concurrent Like insert either commits
-- before this statement takes the row lock (its row is then counted by the
-- subquery) or blocks behind it (the trigger's +1 then applies on top of the
-- reconciled value). Either interleaving lands on the right number, and if one
-- ever did not, the next push repairs it.
DO $$
DECLARE
  repaired integer;
BEGIN
  WITH truth AS (
    SELECT
      p."id",
      (SELECT COUNT(*) FROM public."Like" l WHERE l."postId" = p."id")::integer AS like_count,
      (SELECT COUNT(*) FROM public."Flag" f
        WHERE f."postId" = p."id" AND f."countsTowardHide" IS TRUE)::integer AS flag_count,
      (SELECT COUNT(*) FROM public."Post" c WHERE c."parentId" = p."id")::integer AS comment_count
    FROM public."Post" p
  )
  UPDATE public."Post" p
  SET
    "likeCount"    = t.like_count,
    "flagCount"    = t.flag_count,
    "commentCount" = t.comment_count
  FROM truth t
  WHERE p."id" = t."id"
    AND (
      p."likeCount"    IS DISTINCT FROM t.like_count
      OR p."flagCount"    IS DISTINCT FROM t.flag_count
      OR p."commentCount" IS DISTINCT FROM t.comment_count
    );

  GET DIAGNOSTICS repaired = ROW_COUNT;

  IF repaired > 0 THEN
    RAISE NOTICE 'reconcile: repaired counters on % post(s)', repaired;
  END IF;
END
$$;
