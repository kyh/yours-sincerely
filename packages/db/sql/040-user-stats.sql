-- UserStats, parameterized.
--
-- This was a VIEW. It computed streaks for EVERY user with a window function over
-- every post in the table and only then filtered to the one user the caller asked
-- for — and it is fired on profile-link HOVER. Measured at 14.16 ms / 629 shared
-- buffers to return one row.
--
-- The streak logic below is a VERBATIM port of that view's gap-and-island trick
-- (post_date minus row_number). It is what users see on their profile and it is
-- not worth rewriting from scratch. The only change is WHERE the userId predicate
-- runs: first, instead of after every user's streaks have been computed.
--
-- Deliberately NO `SET search_path` here, unlike the trigger functions. A SET
-- clause makes a function un-inlinable, and an un-inlined SQL function is planned
-- blind: measured at 1.7-2.0 ms / 1056 buffers with the SET, versus 0.55-0.77 ms /
-- 151 buffers without it, on the same row. The usual reason to pin search_path is
-- to stop an attacker hijacking an unqualified name inside a SECURITY DEFINER
-- function — this one is SECURITY INVOKER (it runs with the caller's own rights,
-- so there is no privilege to escalate) and every object it touches is
-- schema-qualified. Do NOT add a SET clause without re-measuring.
--
-- Called from `packages/api/src/user/user-router.ts`; the row shape is mirrored by
-- `userStatsRow` in `user-schema.ts`.
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
