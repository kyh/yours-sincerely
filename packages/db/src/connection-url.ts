const POOLER_PORT = 6543;
const DIRECT_PORT = 5432;

// WARNING: neither String.replace nor a URL round trip: both can corrupt a password containing :6543.
const POOLER_PORT_AT_END_OF_AUTHORITY = new RegExp(`:${POOLER_PORT}(?=[/?]|$)`, "u");

/** Rewrites a Supabase transaction-mode URL (:6543) to the same host's session
    mode (:5432). Any other URL — including local Supabase's, on whatever port
    `pnpm db:start` wrote into `.env.local` — is returned untouched. */
export const toDirectConnectionUrl = (connectionUrl: string) =>
  connectionUrl.replace(POOLER_PORT_AT_END_OF_AUTHORITY, `:${DIRECT_PORT}`);

/** Appends `-c lock_timeout=<timeout>` to the libpq `options` startup parameter.
    Options the URL already carries are kept: postgres.js reads the last duplicate
    key, so a second `options=` would silently drop them. Only the query is
    re-serialized; everything before it stays byte-identical, as above. */
export const withLockTimeout = (connectionUrl: string, timeout: string) => {
  const queryStart = connectionUrl.indexOf("?");
  const base = queryStart === -1 ? connectionUrl : connectionUrl.slice(0, queryStart);
  const params = new URLSearchParams(queryStart === -1 ? "" : connectionUrl.slice(queryStart + 1));
  const lockTimeout = `-c lock_timeout=${timeout}`;
  const existing = params.get("options");
  params.set(
    "options",
    existing !== null && existing !== "" ? `${existing} ${lockTimeout}` : lockTimeout,
  );

  return `${base}?${params.toString()}`;
};

const UNREACHABLE_TEST_URL = "postgresql://postgres:postgres@127.0.0.1:1/postgres";

/** The app's runtime URL. There is no local default to fall back to: every git branch
    and worktree gets its own local Supabase on its own port, and `pnpm db:start` writes
    this checkout's URL into `.env.local`. So outside tests a missing `POSTGRES_URL` fails boot
    rather than turning into ECONNREFUSED on every request. */
export const resolveRuntimeConnectionUrl = (env: {
  NODE_ENV?: string | undefined;
  POSTGRES_URL?: string | undefined;
}) => {
  if (env.POSTGRES_URL !== undefined && env.POSTGRES_URL !== "") {
    return env.POSTGRES_URL;
  }

  if (env.NODE_ENV === "test") {
    return UNREACHABLE_TEST_URL;
  }

  throw new Error("Missing POSTGRES_URL (locally, `pnpm db:start` writes it to .env.local)");
};
