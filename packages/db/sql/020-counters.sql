-- Denormalized counters on "Post", maintained incrementally.
--
-- They exist because the Feed view used to re-aggregate ALL of "Like", ALL of
-- "Post" and ALL of "Flag" on EVERY page of EVERY feed request. Measured on the
-- seeded fixture (7.8k posts, 40k likes, 400 flags): 13.99 ms and 1189 shared
-- buffers for page 1, and the cost did not depend on how much was asked for —
-- page 50 cost the same as page 1.
--
-- Any new write path touching Like / Flag / child-Post must go through these
-- triggers, or the numbers drift. Drift is the failure mode of denormalization and
-- nobody notices it for weeks — which is why `090-reconcile.sql` recomputes them
-- from ground truth on every push, and why `post-counters.integration.ts` asserts
-- zero drift after each mutation.
--
-- Row-level, not statement-level, so bulk deletes (deletePost / deleteUser cascade
-- through collectDescendantPostIds and delete many rows in ONE statement) are
-- handled a row at a time. When a parent post is deleted in the same statement as
-- its children, the child's decrement simply matches zero rows — the parent is
-- already gone — which is correct, not drift.
--
-- GREATEST(x - 1, 0) everywhere: a counter must never go negative, even if a
-- decrement somehow arrives without its matching increment. A negative flagCount
-- would read as "not hidden" forever.

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
$$;

-- Only flags carrying moderation authority move this counter. `countsTowardHide`
-- is frozen at insert time by `010-flagger.sql`, so the UPDATE branch is
-- belt-and-braces: nothing in the app rewrites it. NULL means "not yet judged"
-- (see `090-reconcile.sql`) and `IS TRUE` keeps it out of the count until it is.
CREATE OR REPLACE FUNCTION public."syncPostFlagCount"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW."countsTowardHide" IS TRUE THEN
      UPDATE public."Post" SET "flagCount" = "flagCount" + 1 WHERE "id" = NEW."postId";
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD."countsTowardHide" IS TRUE THEN
      UPDATE public."Post" SET "flagCount" = GREATEST("flagCount" - 1, 0) WHERE "id" = OLD."postId";
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD."countsTowardHide" IS TRUE) IS DISTINCT FROM (NEW."countsTowardHide" IS TRUE) THEN
      IF NEW."countsTowardHide" IS TRUE THEN
        UPDATE public."Post" SET "flagCount" = "flagCount" + 1 WHERE "id" = NEW."postId";
      ELSE
        UPDATE public."Post" SET "flagCount" = GREATEST("flagCount" - 1, 0) WHERE "id" = NEW."postId";
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

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
$$;
