// WARNING: every sql/ file runs in one transaction, so none may use CREATE INDEX CONCURRENTLY.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

import { toDirectConnectionUrl } from "./connection-url";

const SQL_DIR = path.join(import.meta.dirname, "..", "sql");

const connectionUrl = process.env.POSTGRES_URL;

if (!connectionUrl) {
  throw new Error("Missing POSTGRES_URL");
}

const nonPoolingUrl = toDirectConnectionUrl(connectionUrl);

const sql = postgres(nonPoolingUrl, {
  max: 1,
  onnotice: (notice) => {
    if (notice.message) {
      console.log(`  note: ${notice.message}`);
    }
  },
});

const main = async () => {
  const entries = await readdir(SQL_DIR);
  const files = entries.filter((name) => name.endsWith(".sql")).toSorted();

  if (files.length === 0) {
    throw new Error(`No .sql files found in ${SQL_DIR}`);
  }

  console.log(`Applying ${files.length} sql file(s) from sql/`);

  await sql.begin(async (tx) => {
    // WARNING: without this lock_timeout one slow query parks the push, and every feed read, like and post queues behind it.
    await tx.unsafe("SET LOCAL lock_timeout = '5s'").simple();

    for (const file of files) {
      const content = await readFile(path.join(SQL_DIR, file), "utf-8");

      try {
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
