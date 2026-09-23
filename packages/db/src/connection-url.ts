/** The one place the Postgres connection URL is resolved and adjusted.
 *
 *  Supabase's pooler host serves two modes by port: 6543 is transaction mode, 5432
 *  is session mode. Transaction mode lends a backend for one transaction at a time,
 *  so nothing session-scoped (a plain `SET`, a named prepared statement) survives
 *  from one transaction to the next, and Supabase's docs keep migrations off it.
 *  Session mode, like the direct connection (`db.<ref>.supabase.co:5432`), holds one
 *  backend for the life of the connection, which is what DDL tooling assumes.
 *
 *  `drizzle.config.ts` and `apply-sql.ts` MUST resolve to the same database:
 *  `pnpm db:push` runs drizzle-kit and then the applier, and a schema half-applied
 *  through two different connections is the worst outcome available. They used to
 *  hold separate copies of this rewrite, kept in step by a comment. Now they import
 *  it, and it is tested.
 */

const POOLER_PORT = 6543;
const DIRECT_PORT = 5432;

/** Matches `:6543` only where a port can actually appear: at the end of the
    authority, i.e. immediately before the path, the query, or end-of-string.
 *
 *  Deliberately NOT `String.replace(":6543", ":5432")`, which replaces the FIRST
 *  occurrence anywhere — including inside a password that happens to contain
 *  `:6543`, silently corrupting the credential AND leaving the real port alone.
 *
 *  Deliberately NOT `new URL()` + `.port =` + `.toString()` either, tempting as it
 *  is: that round-trips the whole string through the URL serializer, which
 *  re-encodes the userinfo (`pw:6543` comes back as `pw%3A6543`). It is only
 *  equivalent if the driver percent-decodes the password, and a deploy is not the
 *  place to discover it does not. This rewrite is byte-identical everywhere except
 *  the four characters of the port. */
const POOLER_PORT_AT_END_OF_AUTHORITY = new RegExp(`:${POOLER_PORT}(?=[/?]|$)`, "u");

/** Rewrites a Supabase transaction-mode URL (:6543) to the same host's session
    mode (:5432). Any other URL — including local Supabase on 54322 — is returned
    untouched. */
export const toDirectConnectionUrl = (connectionUrl: string): string =>
  connectionUrl.replace(POOLER_PORT_AT_END_OF_AUTHORITY, `:${DIRECT_PORT}`);

/** Appends `-c lock_timeout=<timeout>` to the libpq `options` startup parameter.
    Options the URL already carries are kept: postgres.js reads the last duplicate
    key, so a second `options=` would silently drop them. Only the query is
    re-serialized; everything before it stays byte-identical, as above. */
export const withLockTimeout = (connectionUrl: string, timeout: string): string => {
  const queryStart = connectionUrl.indexOf("?");
  const base = queryStart === -1 ? connectionUrl : connectionUrl.slice(0, queryStart);
  const params = new URLSearchParams(queryStart === -1 ? "" : connectionUrl.slice(queryStart + 1));
  const lockTimeout = `-c lock_timeout=${timeout}`;
  const existing = params.get("options");
  params.set("options", existing ? `${existing} ${lockTimeout}` : lockTimeout);
  return `${base}?${params.toString()}`;
};

const LOCAL_SUPABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** The app's runtime URL. Outside production a missing `POSTGRES_URL` means local
    Supabase; in production that fallback would turn a missing variable into
    ECONNREFUSED on every request instead of a failed boot. */
export const resolveRuntimeConnectionUrl = (env: {
  NODE_ENV?: string | undefined;
  POSTGRES_URL?: string | undefined;
}): string => {
  if (env.POSTGRES_URL) {
    return env.POSTGRES_URL;
  }
  if (env.NODE_ENV === "production") {
    throw new Error("Missing POSTGRES_URL");
  }
  return LOCAL_SUPABASE_URL;
};
