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
