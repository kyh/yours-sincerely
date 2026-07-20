# Agent Instructions

Anonymous love letters app with disappearing ink. T3 Turbo stack + Supabase (as the
Postgres host — see "Architecture decisions" before assuming anything else about it).

## Agent-driven development

`AGENTS.md` is the tool-agnostic guide: provisioning that actually works from a fresh
clone, how to verify a change end-to-end (`pnpm verify` plus a browser recipe against the
real UI), and which surfaces an agent can check at runtime at all. **Read it before
starting work**; it is meant to be run, not skimmed. This file stays the Claude-facing
reference for conventions and for the architecture decisions below — the two do not
duplicate each other.

## Stack

- **Monorepo**: pnpm + Turborepo
- **Web**: Next.js (App Router, Turbopack), Tailwind v4, tRPC
- **Mobile**: Expo / React Native (`apps/expo`) — the shipping native app
- **Legacy mobile**: Capacitor (`apps/mobile`) — superseded WebView shell, plus the
  `@capacitor/*` runtime inside `apps/web` (see "Architecture decisions"). Do not add
  features; do not delete either without reading "Architecture decisions" first.
- **DB**: Postgres (Supabase) + Drizzle ORM
- **Auth**: hand-rolled signed-cookie sessions (`packages/api/src/auth/session.ts`).
  **Not Supabase Auth.** Supabase is the Postgres host and local CLI only.
  Read "Architecture decisions" before changing anything here.
- **Notifications**: Knock
- **Hosting**: Vercel

## Structure

```
apps/
  web/         # Next.js web app
  expo/        # iOS/Android native app (Expo) — the one that ships
  mobile/      # Legacy Capacitor shell — superseded, pending removal. Its Android
               # applicationId still matches the live Play Store package, so it is
               # the only source that can rebuild the legacy Android artifact.
packages/
  api/         # tRPC routers + auth/session
  contracts/   # SHARED domain: zod schemas + pure rules used by BOTH web and expo.
               # Shared domain logic belongs HERE, not duplicated per-platform.
  db/          # Drizzle schema, Postgres client
  ui/          # shadcn-ui components (web only)
```

## Commands

```bash
pnpm dev              # All packages (turbo watch)
pnpm dev:web          # Web only
pnpm dev:expo         # Expo only
pnpm db:start         # Start local Supabase
pnpm db:stop          # Stop Supabase
pnpm db:reset         # Reset DB
pnpm db:push          # Push schema to local
pnpm db:push-remote   # Push schema to production
pnpm db:seed          # Perf fixture — large, NOT idempotent, no signable accounts
pnpm verify           # typecheck + lint + format + test — mirrors CI, run before commit
pnpm lint             # oxlint (NOT ESLint), warnings are errors
pnpm format           # oxfmt --check (use format:fix to write)
pnpm typecheck        # TypeScript
pnpm test             # node:test suites (turbo run test)
pnpm build            # Build all
```

## DB (packages/db)

```bash
pnpm -F db studio     # Drizzle Studio
pnpm -F db seed       # Run seed script
pnpm -F db apply-sql  # Re-apply sql/ only (push already does this)
```

**The schema is declared, not migrated. There are no migrations.** It has two halves,
and `pnpm db:push` applies both, in this order:

1. `src/drizzle-schema.ts` — tables, columns, indexes. `drizzle-kit push` syncs these.
2. `sql/*.sql` — functions, triggers, grants, **and views**. `src/apply-sql.ts` runs
   every file, in filename order, in one transaction. Every file is idempotent; it
   re-runs on every push. See `sql/README.md`.

`pnpm db:push` is therefore the whole deploy, and `pnpm db:reset` is
`supabase db reset && push && seed`. Nothing is replayed, so no migration history can
drift from the schema.

The LOCAL `push` runs `drizzle-kit push --force` so a headless run cannot hang on the TTY
confirmation prompt. `--force` accepts data-loss statements without asking, which is fine
against a disposable local database and is why `push:remote` deliberately does **not** carry
it — production stays interactive.

**`drizzle-kit push` does NOT diff a view's body.** This is the trap. It creates a view
that is missing and drops one deleted from the schema file, but when the name already
exists it emits _nothing_, however much the SELECT changed — exit 0, no warning.
Verified against a production-shaped database. So: **any view is declared `.existing()`
in `drizzle-schema.ts` (for column types only) and its DDL lives in `sql/090-views.sql`.**
A view written with `.as(...)` will silently rot in production while push reports
success. `main` shipped a `Feed` whose drizzle copy had already drifted from the
deployed view (it was missing `AND p."parentId" IS NULL`, which would have put every
comment in the feed); it never broke anything _only_ because push ignored it.

Corollary: **push cannot roll a view back either.** Reverting the schema file and
pushing will leave the new view live. A rollback needs explicit SQL.

The old `generate`/`migrate` scripts are gone, which retired the standing footgun that
generate emitted `DROP TABLE "auth"."users" CASCADE` into every migration (an artifact
of `schemaFilter: ["public"]` hiding Supabase's `auth` schema). `push` never had that
bug — verified, it emits no `auth` DDL.

## Testing

Test runner is Node's built-in `node:test` + `node:assert/strict`. **Do not add vitest or jest.**

- `pnpm test` — unit suites (`*.test.ts`), no I/O, runs in CI.
- `pnpm -F @repo/api test:db` — integration suites (`*.integration.ts`) against a local
  Supabase. Not run in CI (CI has no Supabase).

The pattern to follow for anything with I/O: extract a pure, dependency-injected core
(`*-core.ts`) and test it with in-memory fakes. The exemplars are
`apps/expo/src/lib/legacy-session-migration-core.ts` and
`packages/api/src/auth/session-core.ts` — read one before writing new tests.

Test globs in package.json scripts MUST stay single-quoted (`'src/**/*.test.ts'`) so
/bin/sh cannot expand them and silently narrow the test run.

## Architecture decisions — do not reverse

These look like anti-patterns from the outside. They are deliberate, and each one has a
failure mode that is silent and severe. Read this section before "fixing" any of them.

### Sessions are hand-rolled, not Supabase Auth

Sessions are a signed cookie: `base64({user, iat})` signed with `COOKIE_SECRET` via
`cookie-signature`. Implementation: `packages/api/src/auth/session.ts`.

**Why:**

1. **Anonymous-first identity.** Writing a letter requires no account. The server mints a
   credential-less `User` row on first write (`packages/api/src/auth/auth-utils.ts`,
   `createUserIfNotExists`) and hands back a session. A stock auth provider has no model
   for "a user with no credentials, created as a side effect of a POST" — and this is the
   product's core act, not an edge case.
2. **Sessions NEVER expire.** This is deliberate and load-bearing — not an oversight, and
   not a security gap to close. **Do not add a timeout, an idle expiry, or a shorter max
   age.** A user who wrote letters anonymously years ago must still own them, and the
   legacy cookies carried forward by the native app have no expiry semantics at all. The
   400-day cookie `maxAge` is the browser's hard ceiling, refreshed by sliding renewal
   (`renewSessionIfStale`) — a workaround for a browser limit, **not** a session lifetime.
3. **Revocation is a different thing, and it exists.** `sessionEpoch` on the user row lets
   us invalidate a user's outstanding sessions on demand ("sign out everywhere"). That is
   desirable and orthogonal to (2) — revocation is deliberate; expiry is not.
4. **Signer rotation must not log anyone out.** `COOKIE_SECRET_LEGACY` is a
   comma-separated list of secrets accepted for verification only. This is what makes the
   live Capacitor→Expo identity migration survivable — the native app carries the legacy
   cookie forward verbatim.

**Consequences:** we own the security of this code. Any change to the cookie payload shape
must stay backward-compatible with cookies already in the wild, or it is a mass logout.

**Rejected:** Supabase Auth — no anonymous-user model that fits (1); migrating would orphan
every existing anonymous author from their letters.

### The Supabase Data API is OFF — that is why there are no RLS policies

There is not a single RLS policy in this repo, and that is correct: nothing can reach the
tables except `packages/api`, which holds the Postgres connection directly.

**If anyone re-enables the Data API (PostgREST), every table in `public` becomes directly
readable and writable with the anon key, bypassing all of `packages/api`** — every
authorization check, rate limit, and input cap in the tRPC layer becomes optional. Turning
it on without first writing RLS policies for every table is a full data breach, not a
config change.

### Legacy Capacitor runtime in `apps/web` is load-bearing

`apps/web` still depends on `@capacitor/app`, `@capacitor/core`, `@capacitor/splash-screen`
and mounts `apps/web/src/components/providers/capacitor-provider.tsx` in the root layout.
**Do not remove them.** The legacy Capacitor app is a _remote WebView_ pointed at production
web — it runs `apps/web`'s JavaScript live on users' phones today. The provider hides its
splash screen (`launchAutoHide: false` makes `SplashScreen.hide()` mandatory) and wires the
Android back button. Removing it strands every remaining legacy install on a permanent
splash screen. Gated on store-rollout data; tracked as GitHub issue #72.

`apps/expo/src/lib/legacy-session-migration*.ts` is the identity-upgrade path off that app.
It must survive.

### `apps/mobile` cannot be deleted yet either — the Android id still matches

It is tempting to delete `apps/mobile` on the grounds that its `appId`
(`com.kyh.yourssincerely`) does not match the live iOS bundle
(`com.tehkaiyu.yourssincerely`). That reasoning is **only true for iOS**.

On Android it is the opposite: `apps/mobile/android/app/build.gradle` declares
`applicationId "com.kyh.yourssincerely"`, which is **exactly** `MOBILE_ANDROID_PACKAGE` in
`packages/contracts/src/mobile-identity.ts` — the live Play Store package. So `apps/mobile`
is the only source in the repo that can rebuild the shipped legacy **Android** app, and
`docs/wayfinder/expo-mobile-parity/07-release-gate.md` still has "Android legacy-session
upgrade journey" unchecked. Delete it only once that gate is closed (or once it is agreed
the store build alone is enough — `docs/phone-testing.md` says the upgrade test installs
the public store build, which would make deletion safe).

## Tracked constraints — do not "fix" these

- **TypeScript is held at v6.** TS 7 removed the JS Compiler API that Next.js's type-check
  step loads, so `next build` fails on TS 7. `pnpm.updateConfig.ignoreDependencies` keeps
  update sweeps off it. Exit criterion: Next ships non-experimental `tsgo` support. Re-test
  with `pnpm -F @repo/web build` on a scratch branch before lifting.
- **NativeWind is on `5.0.0-preview.3`** (exact pin) with `react-native-css@3.0.7`. Do not
  bump either without bumping both and running a real device build. Exit criterion:
  NativeWind 5.0.0 stable.
- **`lightningcss` is pinned** via `pnpm.overrides` in the root `package.json`.
- **Expo's `react`/`react-dom` are pinned via the `expo` named catalog**, not the default
  one. Expo must hold an SDK-blessed React, which may diverge from web.
