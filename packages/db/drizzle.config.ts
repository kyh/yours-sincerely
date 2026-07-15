import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

/** DDL must not go through the transaction pooler — it holds no session state, so
    a multi-statement transaction can land on different backends. `src/apply-sql.ts`
    rewrites the port identically; the two must agree or push and the applier would
    target different databases. */
const nonPoolingUrl = process.env.POSTGRES_URL.replace(":6543", ":5432");

/** There is no `out`, and no `generate`/`migrate` script, because this schema is
    declared rather than accumulated: `drizzle-kit push` syncs tables, columns and
    indexes from the file below, and `sql/` holds everything push cannot express
    (functions, triggers, grants, views). `pnpm -F db push` runs both. Nothing is
    replayed, so there is no migration history to drift from the schema.

    Dropping `generate` also retired the standing footgun that it emitted
    `DROP TABLE "auth"."users" CASCADE` into every generated migration — an
    artifact of `schemaFilter` below hiding Supabase's `auth` schema, which made
    drizzle-kit believe the table was an orphan. Each migration had that line
    commented out by hand. `push` never had the bug: verified against a
    production-shaped database, it emits no `auth` DDL at all. */
export default {
  schema: "./src/drizzle-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: nonPoolingUrl,
  },
  schemaFilter: ["public"],
} satisfies Config;
