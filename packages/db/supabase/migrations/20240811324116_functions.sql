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