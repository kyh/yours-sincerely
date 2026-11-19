import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { resolveRuntimeConnectionUrl } from "./connection-url";
import { relations } from "./drizzle-relations";

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
