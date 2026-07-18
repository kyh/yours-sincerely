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

| File                             | Contains                                                        |
| -------------------------------- | --------------------------------------------------------------- |
| `000-grants.sql`                 | Schema-level grants                                             |
| `010-flagger.sql`                | `isEstablishedFlagger` — the definition of "a flag that counts" |
| `020-counters.sql`               | The three `syncPost*Count` trigger functions                    |
| `040-user-stats.sql`             | `getUserStats(text)`                                            |
| `070-legacy-password-rescue.sql` | Un-strands the accounts orphaned by the 2026-03-10 auth cutover |
| `075-retire-legacy-auth.sql`     | Drops the dead Supabase Auth wiring — after `070` has used it   |
| `080-reconcile.sql`              | Backfill of unjudged flags + absolute recompute of the counters |
| `085-triggers.sql`               | Every trigger — takes ACCESS EXCLUSIVE, so it runs late         |
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

`085-` and `090-` are the only files that take **ACCESS EXCLUSIVE** — `DROP TRIGGER`
on a table, `DROP VIEW` on a view. Everything in this directory runs in ONE
transaction, so those locks are held until COMMIT: **every statement sequenced after
them is time a feed reader spends blocked.** Not "writes blocked" — reads. The feed
stops.

So the slow work goes first and the locks go last. Both files were originally
ordered the other way (`030-triggers`, `050-views`), which meant every push held an
ACCESS EXCLUSIVE lock on `Post` across the reconcile's 2.1s ground-truth computation
(measured against production, 166k posts) plus its 166k-row UPDATE. Every deploy
would have frozen the feed for seconds. Verified with a concurrent reader:
`DROP TRIGGER` on `Post` blocks `SELECT ... FROM "Feed"` outright.

**Do not add a file at or after `085-` unless it is O(1), and do not move slow work
after them.** `apply-sql.ts` sets `lock_timeout` so that a push which cannot get the
lock quickly fails and rolls back rather than queueing — a pending exclusive request
blocks every reader queued behind it, so without the timeout a push during one slow
query becomes a site-wide outage.

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
