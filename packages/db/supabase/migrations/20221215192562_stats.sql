CREATE OR REPLACE VIEW public."UserStats" WITH (security_invoker) AS
WITH daily_posts AS (
  SELECT 
    "userId",
    DATE("createdAt") AS post_date,
    COUNT(*) AS posts_per_day
  FROM "Post"
  GROUP BY "userId", DATE("createdAt")
),
streaks AS (
  SELECT 
    "userId",
    post_date,
    post_date - (ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY post_date))::integer AS streak_group
  FROM daily_posts
),
streak_lengths AS (
  SELECT 
    "userId",
    streak_group,
    COUNT(*) AS streak_length,
    MAX(post_date) AS streak_end
  FROM streaks
  GROUP BY "userId", streak_group
),
post_likes AS (
  SELECT 
    p."id" AS "postId",
    p."userId",
    COALESCE(p."baseLikeCount", 0) + COUNT(l."userId") AS total_likes
  FROM "Post" p
  LEFT JOIN "Like" l ON p."id" = l."postId"
  GROUP BY p."id", p."userId", p."baseLikeCount"
)
SELECT 
  p."userId",
  COUNT(DISTINCT p."id") AS "totalPostCount",
  COALESCE(SUM(pl.total_likes), 0) AS "totalLikeCount",
  COALESCE(MAX(sl.streak_length), 0) AS "longestPostStreak",
  COALESCE(
    (SELECT streak_length 
     FROM streak_lengths sl2 
     WHERE sl2."userId" = p."userId" 
     AND sl2.streak_end = (SELECT MAX(streak_end) FROM streak_lengths sl3 WHERE sl3."userId" = p."userId")
    ), 0
  ) AS "currentPostStreak"
FROM "Post" p
LEFT JOIN streak_lengths sl ON p."userId" = sl."userId"
LEFT JOIN post_likes pl ON p."id" = pl."postId"
GROUP BY p."userId";
