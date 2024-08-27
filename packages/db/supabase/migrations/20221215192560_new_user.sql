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