CREATE OR REPLACE FUNCTION "public"."getRandomPrompt"() RETURNS TEXT
SET
    search_path = '' AS $$
BEGIN
    RETURN (
        SELECT "content"
        FROM "public"."Post"
        ORDER BY RANDOM()
        LIMIT 1
    );
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "public"."triggerSetTimestamps"() RETURNS TRIGGER
SET
    search_path = '' AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW."createdAt" = NOW();
        NEW."updatedAt" = NOW();
    ELSE
        NEW."updatedAt" = NOW();
        NEW."createdAt" = OLD."createdAt";
    END IF;
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER setTimestampsOnPost
    BEFORE INSERT OR UPDATE ON "public"."Post"
FOR EACH ROW
    EXECUTE FUNCTION "public"."triggerSetTimestamps"();

CREATE TRIGGER setTimestampsOnLike
    BEFORE INSERT OR UPDATE ON "public"."Like"
FOR EACH ROW
    EXECUTE FUNCTION "public"."triggerSetTimestamps"();

CREATE TRIGGER setTimestampsOnFlag
    BEFORE INSERT OR UPDATE ON "public"."Flag"
FOR EACH ROW
    EXECUTE FUNCTION "public"."triggerSetTimestamps"();

CREATE TRIGGER setTimestampsOnToken
    BEFORE INSERT OR UPDATE ON "public"."Token"
FOR EACH ROW
    EXECUTE FUNCTION "public"."triggerSetTimestamps"();


-- Function "public.setupNewUser"
-- Setup a new user account after user creation
CREATE
OR REPLACE FUNCTION public."setupNewUser" () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
    "user_name" TEXT;
BEGIN
    IF new."raw_user_meta_data" ->> 'display_name' IS NOT NULL THEN
        "user_name" := new."raw_user_meta_data" ->> 'display_name';
    END IF;

    IF "user_name" IS NULL AND new.email IS NOT NULL THEN
        "user_name" := SPLIT_PART(new.email, '@', 1);
    END IF;

    IF "user_name" IS NULL THEN
        "user_name" := '';
    END IF;

    INSERT INTO public."User" (
        id,
        "displayName",
        email)
    VALUES (
        new.id,
        "user_name",
        new.email);

    RETURN new;
END;

$$;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE PROCEDURE public."setupNewUser" ();


CREATE OR REPLACE VIEW public."publicFeed" AS
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
ORDER BY p."createdAt" DESC;
