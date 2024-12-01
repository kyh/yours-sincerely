CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"rawUserMetaData" jsonb
);

CREATE OR REPLACE VIEW public."Feed" WITH (security_invoker) AS
WITH flagged_posts AS (
    SELECT "postId"
    FROM "public"."Flag"
    GROUP BY "postId"
    HAVING COUNT(*) > 3
)
SELECT 
    p."id",
    p."content",
    p."userId",
    p."createdAt",
    p."parentId",
    p."createdBy",
    COALESCE(p."baseLikeCount", 0) + COALESCE(l.like_count, 0) AS "likeCount",
    COALESCE(c.comment_count, 0) AS "commentCount"
FROM "public"."Post" p
LEFT JOIN (
    SELECT "postId", COUNT(*) AS like_count
    FROM "public"."Like"
    GROUP BY "postId"
) l ON p."id" = l."postId"
LEFT JOIN (
    SELECT "parentId", COUNT(*) AS comment_count
    FROM "public"."Post"
    GROUP BY "parentId"
) c ON p."id" = c."parentId"
WHERE 
    p."id" NOT IN (SELECT "postId" FROM flagged_posts)
    AND p."createdAt" >= CURRENT_DATE - INTERVAL '21 days'
ORDER BY p."createdAt" DESC;

CREATE OR REPLACE VIEW public."UserStats" WITH (security_invoker) AS
WITH daily_posts AS (
  SELECT 
    "userId",
    DATE("createdAt") AS post_date
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
  u."id" AS "userId",
  u."displayName",
  COALESCE(post_count.total_posts, 0) AS "totalPostCount",
  COALESCE(like_count.total_likes, 0) AS "totalLikeCount",
  COALESCE(MAX(sl.streak_length), 0) AS "longestPostStreak",
  COALESCE(
    (SELECT streak_length 
     FROM streak_lengths sl2 
     WHERE sl2."userId" = u."id" 
     AND sl2.streak_end = (SELECT MAX(streak_end) FROM streak_lengths sl3 WHERE sl3."userId" = u."id")
    ), 0
  ) AS "currentPostStreak"
FROM "User" u
LEFT JOIN (
  SELECT "userId", COUNT(*) AS total_posts
  FROM "Post"
  GROUP BY "userId"
) post_count ON u."id" = post_count."userId"
LEFT JOIN (
  SELECT "userId", SUM(total_likes) AS total_likes
  FROM post_likes
  GROUP BY "userId"
) like_count ON u."id" = like_count."userId"
LEFT JOIN streak_lengths sl ON u."id" = sl."userId"
GROUP BY u."id", u."displayName", post_count.total_posts, like_count.total_likes;

-- Function "public.handleNewUser"
-- Setup a new user account after user creation
CREATE
OR REPLACE FUNCTION public."handleNewUser" () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
    "displayName" TEXT;
BEGIN
    IF new."raw_user_meta_data" ->> 'displayName' IS NOT NULL THEN
        "displayName" := new."raw_user_meta_data" ->> 'displayName';
    END IF;

    IF "displayName" IS NULL AND new.email IS NOT NULL THEN
        "displayName" := SPLIT_PART(new.email, '@', 1);
    END IF;

    IF "displayName" IS NULL THEN
        "displayName" := '';
    END IF;

    INSERT INTO public."User" (
        id,
        "displayName",
        email)
    VALUES (
        new.id,
        "displayName",
        new.email);

    RETURN new;
END;

$$;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE PROCEDURE public."handleNewUser" ();
