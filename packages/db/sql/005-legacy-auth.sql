-- DORMANT. Preserved deliberately; do not "clean this up" without reading below.
--
-- This is the pre-hand-rolled-sessions identity path: an INSERT into `auth.users`
-- (Supabase Auth) fires `handleNewUser`, which mirrors the new account into
-- `public."User"`. The app does not use Supabase Auth — sessions are a signed
-- cookie (`packages/api/src/auth/session.ts`) and `User` rows are minted by
-- `createUserIfNotExists` — so nothing writes `auth.users` any more and this
-- trigger has not fired in a long time. `auth.users` is empty locally.
--
-- It is kept for two reasons:
--
-- 1. It was the ONLY definition of this function in the repo, in the old
--    `0001_useful_red_skull.sql`. Deleting the migrations without rescuing it here
--    would have left the function live in production with its source erased from
--    the repo — a silent, permanent loss of the answer to "what is this?".
-- 2. `User.id` for older accounts came from `auth.users.id` via this very trigger.
--    Whether production's `auth.users` is as empty as local's is not knowable from
--    this repo, and a wrong guess orphans real people from their letters.
--
-- Dropping it is a decision that needs production data (`SELECT COUNT(*) FROM
-- auth.users`), not a refactor. Until someone looks, re-declaring it costs one
-- catalog write per push and changes no behaviour.
--
-- The guard exists because `auth` is a Supabase-provided schema. It is absent on a
-- bare Postgres, and this repo treats Supabase as a Postgres host that could be
-- swapped — so its absence must be a no-op, not a failed push.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    RAISE NOTICE 'auth.users absent - skipping dormant Supabase Auth wiring';
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public."handleNewUser"()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $fn$
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
  $fn$;

  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users FOR EACH ROW
    EXECUTE FUNCTION public."handleNewUser"();
END
$$;
