-- Every trigger in the schema, in one file, so "what fires on write?" has one
-- answer. The functions they call live in `010-` and `020-`; the dormant
-- `on_auth_user_created` is the exception and stays in `005-` with the guard that
-- makes `auth`'s absence a no-op.
--
-- DROP IF EXISTS then CREATE, rather than CREATE OR REPLACE TRIGGER: the latter is
-- Postgres 14+, and more importantly this form re-points a trigger whose timing or
-- event list changed, which a bare CREATE OR REPLACE would silently keep.

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
