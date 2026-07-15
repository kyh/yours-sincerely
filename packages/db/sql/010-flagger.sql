-- The flag-censorship fix.
--
-- The ONLY moderation mechanism in the product is auto-hide at >3 flags. Flag's
-- primary key is (postId, userId), which looks like it stops one person flagging
-- four times — except an identity costs one cookieless request, so discarding the
-- cookie between calls hid ANY post in the app with four requests.
--
-- Anyone may still SUBMIT a flag (the row is recorded, for a future moderation
-- queue). What changes is that a brand-new identity does not carry moderation
-- AUTHORITY. Keep writing cheap; make judging expensive.
--
-- `isEstablishedFlagger` is THE definition of "a flag that counts". It is
-- evaluated once, at insert time, and frozen into Flag."countsTowardHide". Every
-- other place that asks "is this post hidden?" — the Feed view, getPost, and
-- Post."flagCount" — reads that boolean and nothing else. There is deliberately no
-- second copy of this rule anywhere, in SQL or in TypeScript.

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
$$;

-- Decides `countsTowardHide` once, at insert time. The application never writes
-- that column; see `packages/api/src/flag/flag-router.ts`.
--
-- Frozen at insert time on purpose: "established" depends on wall-clock age, so a
-- live rule could not be denormalized onto Post."flagCount" without a cron
-- re-evaluating every flag. Freezing errs strictly toward counting FEWER flags,
-- which is the safe direction for a censorship primitive.
--
-- `090-reconcile.sql` is careful not to undo this. Read the note there before
-- changing anything about how this column is populated.
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
$$;
