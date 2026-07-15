# `sql/` — the half of the schema Drizzle cannot express

`drizzle-schema.ts` is the source of truth for tables, columns, indexes and views.
`drizzle-kit push` syncs those and **nothing else** — it has no concept of a
function, a trigger, or a grant.

This directory is the source of truth for everything else. `src/apply-sql.ts`
runs every `*.sql` file here in filename order, in one transaction, and
`pnpm -F db push` runs it immediately after `drizzle-kit push`. Together those two
commands are the whole schema. There is no migration history and nothing to
replay — the desired state is declared, not accumulated.

## Rules for anything added here

**Every file must be idempotent.** It is re-run on every single push, against a
database that may already be in the target state. In practice that means
`CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`,
and `REVOKE`/`GRANT` (naturally idempotent).

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

## Filename order is dependency order

| File                  | Contains                                                        |
| --------------------- | --------------------------------------------------------------- |
| `000-grants.sql`      | Schema-level grants                                             |
| `005-legacy-auth.sql` | Dormant Supabase Auth wiring, preserved deliberately            |
| `010-flagger.sql`     | `isEstablishedFlagger` — the definition of "a flag that counts" |
| `020-counters.sql`    | The three `syncPost*Count` trigger functions                    |
| `030-triggers.sql`    | Every trigger, attached to its table                            |
| `040-user-stats.sql`  | `getUserStats(text)`                                            |
| `080-reconcile.sql`   | Backfill of unjudged flags + absolute recompute of the counters |
| `090-views.sql`       | The `Feed` view — **must stay last**                            |

`080-` is the only file that touches data, and it is what makes counter drift
self-healing: repairing drift is `pnpm db:push`, not a script anyone has to
remember.

`090-` is last, and the ordering is load-bearing rather than cosmetic. `DROP VIEW`
takes an ACCESS EXCLUSIVE lock held until COMMIT, so anything running after it is
time a feed reader spends blocked. With the view swap ahead of the reconcile, every
read would block for the reconcile's full duration — 2.1s of computation against
production before its 166k-row UPDATE even starts. **Do not add a file after `090-`
unless it is O(1).**

## Recovery

Re-running is the first move: every file is idempotent, and `080-reconcile.sql`
recomputes the counters from ground truth, so `pnpm db:push` repairs drift.

Run it a second time after any deploy that lands while writes are live. Inside the
applier's transaction the new triggers are invisible to other sessions until it
commits, so a write landing between the reconcile and the commit fires no trigger
and misses the recompute. A second run costs nothing (the `IS DISTINCT FROM` guard
updates zero rows when clean) and repairs exactly that.

Rolling back needs explicit SQL. `git revert` plus a push will NOT undo a view —
push does not diff view bodies, so it leaves the new one live and cannot recreate a
deleted one. Recover an old view's DDL from this directory's git history.
