-- Retires the Supabase Auth wiring. Runs AFTER 070 on purpose: rescue the
-- credentials first, then take down the machinery that produced them.
--
-- WHAT THIS DROPS: `on_auth_user_created`, a trigger on `auth.users` that fired
-- `public."handleNewUser"()` to mirror a new Supabase Auth account into
-- `public."User"`. That was the signup path until the deliberate cutover on
-- 2026-03-10; since then signup is hand-rolled (`createUserIfNotExists` plus a
-- signed cookie) and nothing has written `auth.users` — verified against
-- production: a steady 20-65 signups/month from 2025-02 through 2026-03-10, then
-- zero.
--
-- WHY IT IS SAFE. Nothing reaches Supabase Auth any more, and this is not a
-- judgement call: `@supabase/supabase-js` is not a dependency of any workspace
-- package, nothing reads `SUPABASE_SERVICE_ROLE_KEY`, and no TypeScript touches the
-- `auth` schema. The trigger can only fire on an INSERT into `auth.users` that
-- cannot come from this codebase. All 489 identities it ever created are already
-- mirrored into `public."User"` (verified: zero orphans).
--
-- WHAT THIS DELIBERATELY DOES NOT DROP: `auth.users` itself, its rows, or the
-- `auth` schema.
--
--   * Those rows are the ONLY copy of the 485 pre-cutover credentials. 070 copies
--     them into `User."passwordHash"`, but until that has run and been confirmed
--     everywhere, deleting them destroys the only way those people get back in.
--     Dropping the wiring is reversible from git; dropping the hashes is not.
--   * `auth` is Supabase-managed. It is not ours to remove, and the Data API being
--     off is what actually keeps it unreachable.
--
-- Once 070 reports 485 rescued in production, `auth.users` holds nothing we need —
-- but it still costs nothing to leave, and it is the last line of retreat if the
-- rescue ever proves incomplete. Deleting it is a separate decision, on evidence,
-- later.
--
-- This file is idempotent (DROP IF EXISTS) and will be a permanent no-op after the
-- first push. It exists rather than simply deleting the old `005-legacy-auth.sql`
-- because push does not manage functions: removing the file would have left
-- `handleNewUser` live in production forever with its source erased from the repo.
-- Delete this file only once production is confirmed clean; a fresh database never
-- creates these objects, so there is then nothing left to drop.

-- The trigger first: the function cannot be dropped while a trigger depends on it.
-- Guarded because `auth` is Supabase-provided and absent on a bare Postgres, where
-- this must be a no-op rather than a failed push.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  END IF;
END
$$;

DROP FUNCTION IF EXISTS public."handleNewUser"();
