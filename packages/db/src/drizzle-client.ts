import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { resolveRuntimeConnectionUrl } from "./connection-url";
import { relations } from "./drizzle-relations";

/** Sized for Vercel Fluid compute: one warm instance serves many requests at once,
    and the instance count grows with traffic. postgres.js defaults to 10 sockets per
    instance that stay open while idle, and every one holds a slot in Supabase's
    pooler (a whole backend, in session mode).
    - `max: 10`, postgres.js's own default and what production has always run
      with. Fewer sockets per instance would free pooler slots but queue concurrent
      requests; that trade needs production load numbers first (GitHub issue #120).
      Not 1: under Fluid, 1 queues every concurrent request behind one socket,
      which Vercel calls out as the anti-pattern.
    - `idle_timeout: 5` seconds, Vercel's figure, hands slots back between bursts.
      Vercel's `attachDatabasePool` would also close them before a suspend, but it
      rejects postgres.js pools.
    - `prepare: false` changes nothing about drizzle's queries, which already run
      unnamed. It covers the statements postgres.js names itself (the array-type
      lookup, each transaction's COMMIT), which transaction mode does not support. */
const client = postgres(
  resolveRuntimeConnectionUrl({
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL,
  }),
  { idle_timeout: 5, max: 10, prepare: false },
);

/** `relations`, not `schema`: in drizzle 1.0 the relation graph is what powers
    `db.query.<table>`, and it carries every table in the schema. */
export const db = drizzle({
  client,
  relations,
});

export type Db = typeof db;
