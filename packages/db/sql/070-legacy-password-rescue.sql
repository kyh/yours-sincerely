-- Rescues the accounts stranded by the March 2026 auth cutover.
--
-- THE BUG. Until 2026-03-10 signup went through Supabase Auth: the password was
-- hashed into `auth.users.encrypted_password` and `handleNewUser` (005) mirrored
-- the account into `public."User"`. Then signup moved to the hand-rolled path,
-- which hashes into `public."User"."passwordHash"`. The existing passwords were
-- never carried across, and `signInWithPassword`
-- (`packages/api/src/auth/auth-router.ts`) reads ONLY `passwordHash`:
--
--     if (!existingUser?.passwordHash) -> reject
--
-- So 485 real accounts could not sign in at all. It went unnoticed for four months
-- because sessions never expire (see CLAUDE.md) — their cookie kept working, so
-- nobody hit the wall until they cleared cookies or changed device. 106 of them
-- own 984 letters.
--
-- WHY A COPY IS SAFE, AND EXACT. Supabase Auth (GoTrue) stores bcrypt. Measured
-- against production: all 485 stranded hashes are `$2a$10$`, length 60. This app
-- uses bcryptjs at `SALT_ROUNDS = 10` (`packages/api/src/auth/session.ts`). Same
-- algorithm, same cost, same encoding — `bcryptjs.compare` accepts these verbatim.
-- Nothing is re-hashed and no password is read, derived or weakened; the hash moves
-- column to column inside one database. Users sign in with the password they
-- originally chose.
--
-- WHY NOT READ auth.users FROM THE APP INSTEAD. A fallback in the sign-in path
-- would make the Supabase `auth` schema permanently load-bearing in the most
-- security-sensitive code we own, would never end (it survives until the last of
-- 485 signs in, i.e. probably never), and would put two credential sources in one
-- path. This is the same operation done once, after which `auth.users` holds
-- nothing we need.
--
-- WHY THIS IS SAFE TO RE-RUN, which it is, on every push:
--   * `passwordHash IS NULL` is a true marker, not a hope. After the first run no
--     row matches and this is a permanent no-op.
--   * It therefore CANNOT clobber a password someone has since set or reset — a
--     non-null `passwordHash` is never touched. That matters: the reset flow
--     (`auth-router.ts` resetPassword) was these users' only way in, and anyone who
--     used it must not be reverted to their old password.
--   * Anonymous authors are not affected: `createUserIfNotExists` gives them a
--     `createTempPassword()` hash, so their `passwordHash` is never null, and they
--     have no `auth.users` row to join to anyway.
--
-- ORDERING: this runs immediately before `075-retire-legacy-auth.sql`, which drops
-- the wiring that created these accounts. Rescue first, retire second — and both
-- inside the applier's single transaction, so a failure here rolls the retirement
-- back with it. `075` deliberately leaves `auth.users` and its rows alone: they are
-- the ONLY copy of these credentials, and dropping the wiring is reversible from
-- git while dropping the hashes is not.
--
-- The guard: `auth` is Supabase-provided, absent on a bare Postgres, and its
-- absence must be a no-op rather than a failed push.
DO $$
DECLARE
  rescued integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    RAISE NOTICE 'auth.users absent - skipping legacy password rescue';
    RETURN;
  END IF;

  UPDATE public."User" u
  SET "passwordHash" = a.encrypted_password
  FROM auth.users a
  WHERE a.id::text = u."id"
    AND u."passwordHash" IS NULL
    AND a.encrypted_password IS NOT NULL;

  GET DIAGNOSTICS rescued = ROW_COUNT;

  IF rescued > 0 THEN
    RAISE NOTICE 'rescued % account(s) stranded by the Supabase Auth cutover', rescued;
  END IF;
END
$$;
