-- Every trigger in the schema, in one file, so "what fires on write?" has one
-- answer. The functions they call live in `010-` and `020-`.
--
-- NUMBERED 085 FOR ONE REASON: **DROP TRIGGER TAKES ACCESS EXCLUSIVE ON THE
-- TABLE**, and the applier runs every file in a single transaction, so that lock
-- is held until COMMIT. Everything sequenced after this file is time during which
-- nobody can read `Post` — not write, READ. The feed stops.
--
-- This file sorted as `030-` at first, ahead of `080-reconcile.sql`. That was
-- wrong and not subtly: it meant every push took an ACCESS EXCLUSIVE lock on
-- `Post` and held it through the reconcile's 2.1s ground-truth computation
-- (measured against production, 166k posts) plus its 166k-row UPDATE. Every
-- deploy would have frozen the feed for seconds — the exact stall `090-views.sql`
-- is ordered last to avoid, reintroduced from inside the same transaction by the
-- file that argued for it. Verified with a concurrent reader: `DROP TRIGGER` on
-- `Post` blocks `SELECT ... FROM "Feed"` outright.
--
-- So this runs after the slow work and immediately before the view swap: the lock
-- window is now two catalog updates, not two seconds. Anything added between here
-- and the end of `090-` must be O(1).
--
-- Running after the reconcile is safe, and is in fact *more* correct. Other
-- sessions cannot see this file's DDL until COMMIT, so in steady state they keep
-- firing the OLD triggers right up to the lock — meaning concurrent writes are
-- still counted while the reconcile runs, and any that touch a row the reconcile
-- repaired simply queue behind its row lock and apply their increment on top.
--
-- DROP IF EXISTS then CREATE, rather than CREATE OR REPLACE TRIGGER: this form
-- re-points a trigger whose timing or event list changed. It is the same choice
-- `090-views.sql` makes and for the same reason — declare the end state, do not
-- assume the existing object resembles it.

-- BEFORE INSERT: decides `countsTowardHide` and writes it into the row being
-- inserted. Must be BEFORE, so the value is present when `flag_sync_post_count`
-- reads it AFTER.
DROP TRIGGER IF EXISTS "flag_counts_toward_hide" ON "public"."Flag";
CREATE TRIGGER "flag_counts_toward_hide"
  BEFORE INSERT ON "public"."Flag"
  FOR EACH ROW
  EXECUTE FUNCTION public."setFlagCountsTowardHide"();

DROP TRIGGER IF EXISTS "like_sync_post_count" ON "public"."Like";
CREATE TRIGGER "like_sync_post_count"
  AFTER INSERT OR DELETE ON "public"."Like"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostLikeCount"();

DROP TRIGGER IF EXISTS "flag_sync_post_count" ON "public"."Flag";
CREATE TRIGGER "flag_sync_post_count"
  AFTER INSERT OR DELETE OR UPDATE ON "public"."Flag"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostFlagCount"();

DROP TRIGGER IF EXISTS "post_sync_comment_count" ON "public"."Post";
CREATE TRIGGER "post_sync_comment_count"
  AFTER INSERT OR DELETE OR UPDATE ON "public"."Post"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostCommentCount"();
