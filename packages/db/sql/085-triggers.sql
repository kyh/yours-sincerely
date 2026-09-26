-- Every trigger in the schema, in one file, so "what fires on write?" has one
-- answer. The functions they call live in `010-` and `020-`.
--
-- NUMBERED 085 FOR ONE REASON: **CREATE TRIGGER BLOCKS EVERY WRITER TO THE TABLE**
-- (SHARE ROW EXCLUSIVE), and the applier runs every file in a single transaction,
-- so that lock is held until COMMIT. Everything sequenced after this file is time
-- during which nobody can like, flag or post. Readers are unaffected.
--
-- So this runs after the slow work (the reconcile measured 2.1s of ground-truth
-- computation against production, 166k posts, before its UPDATE) and immediately
-- before the view swap. Anything added between here and the end of `090-` must be
-- O(1).
--
-- Running after the reconcile is safe, and is in fact *more* correct. Other
-- sessions cannot see this file's DDL until COMMIT, so in steady state they keep
-- firing the OLD triggers right up to the lock — meaning concurrent writes are
-- still counted while the reconcile runs, and any that touch a row the reconcile
-- repaired simply queue behind its row lock and apply their increment on top.
--
-- CREATE OR REPLACE TRIGGER, never DROP TRIGGER. Replace rewrites every property
-- (timing, events, WHEN, function), so it converges on the declared end state just
-- as DROP + CREATE would. But DROP TRIGGER takes ACCESS EXCLUSIVE, which blocks
-- every READER of the table until COMMIT, and `DROP TRIGGER IF EXISTS` takes it
-- even when the trigger is already gone. A DROP left in this file freezes the feed
-- on every push, forever. To split or rename a trigger, keep the old name for one
-- half (as the two split pairs below do); to retire one, drop it in a single push
-- and delete the DROP once production has converged. Needs Postgres 14+.
--
-- Reverting the split is a retirement too. A revert that restores the combined
-- INSERT OR DELETE OR UPDATE triggers leaves `flag_sync_post_count_update` and
-- `post_sync_comment_count_update` installed, firing the same functions, so every
-- re-judge and reparent counts twice until they are dropped explicitly, in a quiet
-- window (ACCESS EXCLUSIVE):
--   DROP TRIGGER "flag_sync_post_count_update" ON "public"."Flag";
--   DROP TRIGGER "post_sync_comment_count_update" ON "public"."Post";

-- BEFORE INSERT: decides `countsTowardHide` and writes it into the row being
-- inserted. Must be BEFORE, so the value is present when `flag_sync_post_count`
-- reads it AFTER.
CREATE OR REPLACE TRIGGER "flag_counts_toward_hide"
  BEFORE INSERT ON "public"."Flag"
  FOR EACH ROW
  EXECUTE FUNCTION public."setFlagCountsTowardHide"();

CREATE OR REPLACE TRIGGER "like_sync_post_count"
  AFTER INSERT OR DELETE ON "public"."Like"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostLikeCount"();

-- The UPDATE halves are separate triggers because only an UPDATE trigger can carry
-- a WHEN over OLD and NEW. `UPDATE OF` plus WHEN mirror the function's own guard,
-- so an update that cannot move the counter queues no event at all. For `Post`
-- that is every counter bump from these very triggers and every row the reconcile
-- repairs. `080-`'s NULL -> judged backfill still fires the Flag one.
CREATE OR REPLACE TRIGGER "flag_sync_post_count"
  AFTER INSERT OR DELETE ON "public"."Flag"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostFlagCount"();

CREATE OR REPLACE TRIGGER "flag_sync_post_count_update"
  AFTER UPDATE OF "countsTowardHide" ON "public"."Flag"
  FOR EACH ROW
  WHEN ((OLD."countsTowardHide" IS TRUE) IS DISTINCT FROM (NEW."countsTowardHide" IS TRUE))
  EXECUTE FUNCTION public."syncPostFlagCount"();

CREATE OR REPLACE TRIGGER "post_sync_comment_count"
  AFTER INSERT OR DELETE ON "public"."Post"
  FOR EACH ROW EXECUTE FUNCTION public."syncPostCommentCount"();

CREATE OR REPLACE TRIGGER "post_sync_comment_count_update"
  AFTER UPDATE OF "parentId" ON "public"."Post"
  FOR EACH ROW
  WHEN (OLD."parentId" IS DISTINCT FROM NEW."parentId")
  EXECUTE FUNCTION public."syncPostCommentCount"();
