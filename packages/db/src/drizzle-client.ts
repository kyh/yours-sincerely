import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { relations } from "./drizzle-relations";

const client = postgres(
  process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);

/** `relations`, not `schema`: in drizzle 1.0 the relation graph is what powers
    `db.query.<table>`, and it carries every table in the schema. */
export const db = drizzle({
  client,
  relations,
});

export type Db = typeof db;
