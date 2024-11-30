CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"rawUserMetaData" jsonb
);
--> statement-breakpoint
CREATE VIEW "public"."Feed" WITH (security_invoker = true) AS (WITH flagged_posts AS ( SELECT "Flag"."postId" FROM "Flag" GROUP BY "Flag"."postId" HAVING count(*) > 3 ) SELECT p.id, p.content, p."userId", p."createdAt", p."parentId", p."createdBy", COALESCE(p."baseLikeCount", 0) + COALESCE(l.like_count, 0::bigint) AS "likeCount", COALESCE(c.comment_count, 0::bigint) AS "commentCount" FROM "Post" p LEFT JOIN ( SELECT "Like"."postId", count(*) AS like_count FROM "Like" GROUP BY "Like"."postId") l ON p.id = l."postId" LEFT JOIN ( SELECT "Post"."parentId", count(*) AS comment_count FROM "Post" GROUP BY "Post"."parentId") c ON p.id = c."parentId" WHERE NOT (p.id IN ( SELECT flagged_posts."postId" FROM flagged_posts)) AND p."createdAt" >= (CURRENT_DATE - '21 days'::interval) ORDER BY p."createdAt" DESC);--> statement-breakpoint
CREATE VIEW "public"."UserStats" WITH (security_invoker = true) AS (WITH daily_posts AS ( SELECT "Post"."userId", date("Post"."createdAt") AS post_date FROM "Post" GROUP BY "Post"."userId", (date("Post"."createdAt")) ), streaks AS ( SELECT daily_posts."userId", daily_posts.post_date, daily_posts.post_date - row_number() OVER (PARTITION BY daily_posts."userId" ORDER BY daily_posts.post_date)::integer AS streak_group FROM daily_posts ), streak_lengths AS ( SELECT streaks."userId", streaks.streak_group, count(*) AS streak_length, max(streaks.post_date) AS streak_end FROM streaks GROUP BY streaks."userId", streaks.streak_group ), post_likes AS ( SELECT p.id AS "postId", p."userId", COALESCE(p."baseLikeCount", 0) + count(l."userId") AS total_likes FROM "Post" p LEFT JOIN "Like" l ON p.id = l."postId" GROUP BY p.id, p."userId", p."baseLikeCount" ) SELECT u.id AS "userId", u."displayName", COALESCE(post_count.total_posts, 0::bigint) AS "totalPostCount", COALESCE(like_count.total_likes, 0::numeric) AS "totalLikeCount", COALESCE(max(sl.streak_length), 0::bigint) AS "longestPostStreak", COALESCE(( SELECT sl2.streak_length FROM streak_lengths sl2 WHERE sl2."userId" = u.id AND sl2.streak_end = (( SELECT max(sl3.streak_end) AS max FROM streak_lengths sl3 WHERE sl3."userId" = u.id))), 0::bigint) AS "currentPostStreak" FROM "User" u LEFT JOIN ( SELECT "Post"."userId", count(*) AS total_posts FROM "Post" GROUP BY "Post"."userId") post_count ON u.id = post_count."userId" LEFT JOIN ( SELECT post_likes."userId", sum(post_likes.total_likes) AS total_likes FROM post_likes GROUP BY post_likes."userId") like_count ON u.id = like_count."userId" LEFT JOIN streak_lengths sl ON u.id = sl."userId" GROUP BY u.id, u."displayName", post_count.total_posts, like_count.total_likes);

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
