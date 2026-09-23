import type { Config } from "drizzle-kit";

import { toDirectConnectionUrl, withLockTimeout } from "./src/connection-url";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

/** DDL must not go through the transaction pooler. `src/apply-sql.ts` calls the
    same helper: the two have to resolve to the same database, or `pnpm db:push`
    would apply half the schema through each. */
const nonPoolingUrl = toDirectConnectionUrl(process.env.POSTGRES_URL);

/** There is no `out`, and no `generate`/`migrate` script, because this schema is
    declared rather than accumulated: `drizzle-kit push` syncs tables, columns and
    indexes from the file below (but not an index redefined under its old name:
    see `sql/README.md`), and `sql/` holds everything push cannot express
    (functions, triggers, grants, views). `pnpm -F db push` runs both. Nothing is
    replayed, so there is no migration history to drift from the schema.

    Dropping `generate` also retired the standing footgun that it emitted
    `DROP TABLE "auth"."users" CASCADE` into every generated migration — an
    artifact of `schemaFilter` below hiding Supabase's `auth` schema, which made
    drizzle-kit believe the table was an orphan. Each migration had that line
    commented out by hand. `push` never had the bug: verified against a
    production-shaped database, it emits no `auth` DDL at all. */
export default {
  dbCredentials: {
    /** drizzle-kit applies each statement on its own and sets no lock_timeout, so
        a DROP INDEX or ALTER TABLE queued behind one slow reader blocks every
        reader after it: the outage `apply-sql.ts` prevents with `SET LOCAL`.
        drizzle-kit has no session hook, so the setting rides in the startup
        packet. Verified on a direct connection: a DROP INDEX behind a held reader
        lock fails at the timeout instead of queueing. NOT verified through
        Supavisor, which may drop startup options: check `SHOW lock_timeout`
        through the production URL before relying on it. */
    url: withLockTimeout(nonPoolingUrl, "5s"),
  },
  dialect: "postgresql",
  schema: "./src/drizzle-schema.ts",
  schemaFilter: ["public"],
} satisfies Config;
