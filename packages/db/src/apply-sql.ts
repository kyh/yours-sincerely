/**
 * Applies every `sql/*.sql` file, in filename order, inside ONE transaction.
 *
 * `drizzle-kit push` syncs tables, columns, indexes and views. It has no concept
 * of a function, a trigger or a grant, so it can only ever sync half of this
 * schema. This applies the other half, and `pnpm -F db push` runs the two together
 * — that pair is the entire deploy. See `sql/README.md`.
 *
 * One transaction because a half-applied schema is the genuinely bad state: the
 * `Feed` view reading counters that no trigger maintains yet. Postgres DDL is
 * transactional, so either every function, trigger and grant lands or none does.
 * (This is also why nothing here may use CREATE INDEX CONCURRENTLY, which cannot
 * run inside a transaction. Indexes belong in `drizzle-schema.ts` anyway.)
 *
 * Run with: pnpm -F db apply-sql   (or, normally, via pnpm -F db push)
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

import { toDirectConnectionUrl } from "./connection-url";

const SQL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "sql");

const connectionUrl = process.env.POSTGRES_URL;
if (!connectionUrl) {
  throw new Error("Missing POSTGRES_URL");
}

/** DDL must not go through the transaction pooler. `drizzle.config.ts` calls the
    same helper: the two have to resolve to the same database, or `pnpm db:push`
    would apply half the schema through each. */
const nonPoolingUrl = toDirectConnectionUrl(connectionUrl);

const sql = postgres(nonPoolingUrl, {
  max: 1,
  /** `080-reconcile.sql` reports repaired drift this way. Surfacing it means a
      push that silently fixed thousands of rows cannot look like a push that did
      nothing. */
  onnotice: (notice) => {
    if (notice.message) console.log(`  note: ${notice.message}`);
  },
});

const main = async () => {
  /** Filename order IS dependency order — see `sql/README.md`. Sorting in place is
      safe here (readdir hands back a fresh array, so there is nothing to mutate out
      from under anyone) and `toSorted` would need lib es2023. */
  // oxlint-disable-next-line unicorn/no-array-sort
  const files = (await readdir(SQL_DIR)).filter((name) => name.endsWith(".sql")).sort();

  if (files.length === 0) {
    throw new Error(`No .sql files found in ${SQL_DIR}`);
  }

  console.log(`Applying ${files.length} sql file(s) from sql/`);

  await sql.begin(async (tx) => {
    /** Fail fast instead of taking production down.
     *
     *  `085-triggers.sql` and `090-views.sql` need ACCESS EXCLUSIVE, which conflicts
     *  with the ACCESS SHARE every reader holds. Without a timeout, one slow query
     *  on `Post` — an analytics scan, a backup, a pathological feed page — parks the
     *  DROP behind it, and because a pending exclusive request blocks every lock
     *  request queued after it, EVERY subsequent read of `Post` stalls too. A push
     *  during a slow query would escalate into a site-wide outage lasting as long as
     *  that query.
     *
     *  5s is far longer than the swap needs (two catalog updates) and far shorter
     *  than an outage. On timeout the whole transaction rolls back, changing
     *  nothing: re-run the push. LOCAL, so it dies with this transaction. */
    await tx.unsafe("SET LOCAL lock_timeout = '5s'").simple();

    for (const file of files) {
      const content = await readFile(join(SQL_DIR, file), "utf8");
      try {
        /** `.simple()` because these files hold many statements each, and the
            extended protocol permits exactly one per message. */
        await tx.unsafe(content).simple();
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`sql/${file} failed: ${reason}`, { cause: error });
      }
      console.log(`  applied ${file}`);
    }
  });

  console.log("Done. Schema is functions + triggers + grants in sync.");
};

try {
  await main();
} finally {
  await sql.end();
}
