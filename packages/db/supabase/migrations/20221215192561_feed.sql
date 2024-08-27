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
    p."userId" AS author_id,
    p."createdAt",
    COALESCE(p."baseLikeCount", 0) + COALESCE(l.like_count, 0) AS "likeCount",
    COALESCE(c.comment_count, 0) AS "commentCount",
    CASE 
        WHEN COALESCE(l.like_count, 0) > 0 THEN true
        ELSE false
    END AS "isLiked"
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

CREATE OR REPLACE FUNCTION "public"."getRandomPrompt"() RETURNS TEXT
SET
    search_path = '' AS $$
BEGIN
    RETURN (
        SELECT "content"
        FROM "public"."Prompt"
        ORDER BY RANDOM()
        LIMIT 1
    );
END
$$ LANGUAGE plpgsql;