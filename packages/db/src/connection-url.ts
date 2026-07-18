/** The one place the Postgres connection URL is adjusted for DDL.
 *
 *  Supabase hands out a transaction-pooler URL on port 6543. A transaction pooler
 *  holds no session state, so a multi-statement transaction can land on different
 *  backends — which breaks `SET LOCAL`, and makes a supposedly atomic DDL
 *  transaction anything but. Port 5432 is the direct connection.
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
const POOLER_PORT_AT_END_OF_AUTHORITY = new RegExp(`:${POOLER_PORT}(?=[/?]|$)`);

/** Rewrites a Supabase transaction-pooler URL to its direct-connection
    equivalent. Any other URL — including local Supabase on 54322 — is returned
    untouched. */
export const toDirectConnectionUrl = (connectionUrl: string): string =>
  connectionUrl.replace(POOLER_PORT_AT_END_OF_AUTHORITY, `:${DIRECT_PORT}`);
