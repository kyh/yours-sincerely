# `sql/` — the half of the schema Drizzle cannot express

`drizzle-schema.ts` is the source of truth for tables, columns and indexes (and a
view's column types, nothing more). `drizzle-kit push` syncs those, with the two
blind spots below, and **nothing else** — it has no concept of a function, a
trigger, or a grant.

This directory is the source of truth for everything else. `src/apply-sql.ts`
runs every `*.sql` file here in filename order, in one transaction, and
`pnpm -F db push` runs it immediately after `drizzle-kit push`. Together those two
commands are the whole schema. There is no migration history and nothing to
replay — the desired state is declared, not accumulated.

## Rules for anything added here

**Every file must be idempotent.** It is re-run on every single push, against a
database that may already be in the target state. In practice that means
`CREATE OR REPLACE FUNCTION`, `CREATE OR REPLACE TRIGGER` (never `DROP TRIGGER`:
see `085-triggers.sql`), and `REVOKE`/`GRANT` (naturally idempotent).

**Idempotent is not the same as re-runnable-safely.** A statement can be
idempotent on an empty database and still be destructive on a live one — see
`080-reconcile.sql`, where re-judging a frozen moderation decision would be
idempotent in the trivial sense and a behaviour change in the real one. Ask what
the statement does on the _fourth_ run against production, not the first.

**Never put a one-shot data migration here.** If something must happen exactly
once, it needs a marker in the data that makes the second run a no-op (again, see
`080-reconcile.sql` and `Flag."countsTowardHide" IS NULL`). "I will remember to
run this once" is the exact failure this directory exists to delete.

**Views belong here too, even though Drizzle can express them.** `drizzle-kit
push` does not diff a view's body — it creates a missing view and drops a deleted
one, but silently emits nothing when the name already exists and the SELECT
changed. A view declared with `.as(...)` in `drizzle-schema.ts` will therefore go
stale in production while push reports success. Declare views with `.existing()`
there, for the column types only, and put the DDL in `090-views.sql`.

A view also pins the columns it reads. Push runs before this directory, so an
`ALTER COLUMN ... TYPE` on a `Post` column `Feed` selects fails push outright
(`cannot alter type of a column used by a view`). That change needs the view
dropped by hand first, in the same maintenance window; `090-` recreates it.

## Never change an index definition in place

Push has the same blind spot for indexes. drizzle-kit 1.0.0-rc.4 skips, in push
mode only, an index whose name is unchanged but whose `WHERE` changed or whose
columns, order, sort direction or opclass changed without changing the column
count. `push` prints `No changes detected` and exits 0. It does recreate an index
whose WHERE was added or removed, whose column count changed, or whose
`unique`/`using`/`with` changed, but do not rely on knowing which is which.

**Rename the index instead**, and when push asks "rename or create", answer
**create** (headless: `--hints '[{"type":"create","kind":"index","entity":["public","<table>","<new name>"]}]'`).
That emits `DROP INDEX` + `CREATE INDEX`. Answering rename emits only
`ALTER INDEX ... RENAME`, and the new definition is silently discarded. Neither
statement is `CONCURRENTLY`: `DROP INDEX` takes ACCESS EXCLUSIVE on the table and
`CREATE INDEX` blocks its writes for the whole build, so do it in a quiet window.

Push never repairs drift it cannot see, so production can already disagree with
this file. Before trusting an index definition there, diff
`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'` against
`pnpm -F db drizzle:kit export`.

## Filename order is dependency order

| File                             | Contains                                                        |
| -------------------------------- | --------------------------------------------------------------- |
| `000-grants.sql`                 | Schema-level grants                                             |
| `010-flagger.sql`                | `isEstablishedFlagger` — the definition of "a flag that counts" |
| `020-counters.sql`               | The three `syncPost*Count` trigger functions                    |
| `040-user-stats.sql`             | `getUserStats(text)`                                            |
| `070-legacy-password-rescue.sql` | Un-strands the accounts orphaned by the 2026-03-10 auth cutover |
| `075-retire-legacy-auth.sql`     | Drops the dead Supabase Auth wiring — after `070` has used it   |
| `080-reconcile.sql`              | Backfill of unjudged flags + absolute recompute of the counters |
| `085-triggers.sql`               | Every trigger — blocks writers until COMMIT, so it runs late    |
| `090-views.sql`                  | The `Feed` view — **must stay last**                            |

`070-` then `075-` is deliberate: rescue the credentials, then retire the machinery
that made them. Both are transitional and can be deleted once production is
confirmed clean — `075-` has to exist rather than just deleting the file that
created the wiring, because push does not manage functions, so removing it would
have left `handleNewUser` live in production with its source erased from the repo.

`080-` is the only file that touches data, and it is what makes counter drift
self-healing: repairing drift is `pnpm db:push`, not a script anyone has to
remember.

### The last two files hold locks. That is what the numbering is for.

Everything in this directory runs in ONE transaction, so every lock is held until
COMMIT. Two files take locks that other sessions feel:

- `085-` takes **SHARE ROW EXCLUSIVE** on `Post`, `Like` and `Flag`
  (`CREATE OR REPLACE TRIGGER`): nobody can post, like or flag until COMMIT.
  Readers are unaffected. `DROP TRIGGER` would take ACCESS EXCLUSIVE and stop
  reads as well, even with `IF EXISTS` on a trigger that is already gone, which is
  why that file never drops one.
- `090-` takes **ACCESS EXCLUSIVE** on `Feed` (`DROP VIEW`): **every statement
  sequenced after it is time a feed reader spends blocked.** The feed stops.

So the slow work goes first and the locks go last. The reconcile's ground-truth
computation measured 2.1s against production (166k posts) before its 166k-row
UPDATE even starts; sequenced after either lock, every deploy would freeze posting
or the feed for that long.

**Do not add a file at or after `085-` unless it is O(1), and do not move slow work
after them.** `apply-sql.ts` sets `lock_timeout` so that a push which cannot get the
lock quickly fails and rolls back rather than queueing — a pending lock request
blocks every conflicting request queued behind it, so without the timeout a push
during one slow query becomes a site-wide outage. `drizzle.config.ts` asks for the
same timeout for push's own DDL, but Supavisor drops it, so lock-heavy DDL runs by hand
first (see CLAUDE.md).

## Recovery

Re-running is the first move: every file is idempotent, and `080-reconcile.sql`
recomputes the counters from ground truth, so `pnpm db:push` repairs drift.

Run it a second time after any deploy that lands while writes are live. Inside the
applier's transaction the new triggers are invisible to other sessions until it
commits, so a write landing between the reconcile and the commit fires no trigger
and misses the recompute. A second run costs nothing (the `IS DISTINCT FROM` guard
updates zero rows when clean) and repairs exactly that.

A view in `090-` rolls back with `git revert` plus a push, because that file drops
and recreates it on every run. Deleting a view's DDL from `090-` does not drop the
view, though: that needs an explicit `DROP VIEW` left in the file. Reverting a
view in `drizzle-schema.ts` rolls nothing back: push does not diff view bodies.

A trigger does not roll back that way. `085-` only ever creates or replaces, so a
revert that removes a trigger name leaves the trigger installed. Reverting the split
of the counter triggers into INSERT OR DELETE and UPDATE halves needs an explicit
`DROP TRIGGER "flag_sync_post_count_update" ON "public"."Flag"` and
`DROP TRIGGER "post_sync_comment_count_update" ON "public"."Post"`, run in a quiet
window because DROP TRIGGER takes ACCESS EXCLUSIVE. Until then both halves fire the
same function, and every re-judge or reparent counts twice.
