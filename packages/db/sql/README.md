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
`090-reconcile.sql`, where re-judging a frozen moderation decision would be
idempotent in the trivial sense and a behaviour change in the real one. Ask what
the statement does on the _fourth_ run against production, not the first.

**Never put a one-shot data migration here.** If something must happen exactly
once, it needs a marker in the data that makes the second run a no-op (again, see
`090-reconcile.sql` and `Flag."countsTowardHide" IS NULL`). "I will remember to
run this once" is the exact failure this directory exists to delete.

**Views belong here too, even though Drizzle can express them.** `drizzle-kit
push` does not diff a view's body — it creates a missing view and drops a deleted
one, but silently emits nothing when the name already exists and the SELECT
changed. A view declared with `.as(...)` in `drizzle-schema.ts` will therefore go
stale in production while push reports success. Declare views with `.existing()`
there, for the column types only, and put the DDL in `050-views.sql`.

## Filename order is dependency order

| File                  | Contains                                                        |
| --------------------- | --------------------------------------------------------------- |
| `000-grants.sql`      | Schema-level grants                                             |
| `005-legacy-auth.sql` | Dormant Supabase Auth wiring, preserved deliberately            |
| `010-flagger.sql`     | `isEstablishedFlagger` — the definition of "a flag that counts" |
| `020-counters.sql`    | The three `syncPost*Count` trigger functions                    |
| `030-triggers.sql`    | Every trigger, attached to its table                            |
| `040-user-stats.sql`  | `getUserStats(text)`                                            |
| `050-views.sql`       | The `Feed` view                                                 |
| `090-reconcile.sql`   | Backfill of unjudged flags + absolute recompute of the counters |

`090-` runs last on purpose: it is the only file that touches data, and it is what
makes counter drift self-healing. Correcting drift is `pnpm -F db push`.
