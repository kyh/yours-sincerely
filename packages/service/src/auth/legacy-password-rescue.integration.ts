import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { after, test } from "node:test";

import { eq, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { user } from "@repo/db/drizzle-schema";
import { compare, hash } from "bcryptjs";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

const RESCUE_SQL = path.join(import.meta.dirname, "../../../db/sql/070-legacy-password-rescue.sql");

const ORIGINAL_PASSWORD = "the password they chose in 2025";
const RESET_PASSWORD = "the password they chose after resetting";

after(async () => {
  await db.$client.end();
});

const gotrueHash = async (password: string) => {
  const hashed = await hash(password, 10);

  return hashed.replace(/^\$2[aby]\$/u, "$2a$");
};

const runRescue = async () => {
  await db.execute(sql.raw(await readFile(RESCUE_SQL, "utf-8")));
};

const createStrandedAccount = async () => {
  const id = randomUUID();
  const email = `${id}@example.com`;
  const encrypted = await gotrueHash(ORIGINAL_PASSWORD);
  await db.execute(
    sql`INSERT INTO auth.users (id, email, encrypted_password)
        VALUES (${id}::uuid, ${email}, ${encrypted})`,
  );
  await db.insert(user).values({ displayName: "Stranded", email, id, passwordHash: null });

  return id;
};

const passwordHashOf = async (id: string) => {
  const rows = await db.execute<{ passwordHash: string | null }>(
    sql`SELECT "passwordHash" FROM public."User" WHERE id = ${id}`,
  );

  assert.equal(rows.length, 1, "expected exactly one User row");

  return rows[0]?.passwordHash ?? null;
};

const cleanup = async (id: string) => {
  await db.delete(user).where(eq(user.id, id));
  await db.execute(sql`DELETE FROM auth.users WHERE id::text = ${id}`);
};

integrationTest("a stranded account can sign in with its original password again", async () => {
  const id = await createStrandedAccount();

  try {
    assert.equal(await passwordHashOf(id), null, "precondition: locked out");

    await runRescue();

    const rescued = await passwordHashOf(id);
    assert.ok(rescued, "rescue must give the account a passwordHash");
    assert.ok(
      await compare(ORIGINAL_PASSWORD, rescued),
      "the account must authenticate with the password it originally chose",
    );
  } finally {
    await cleanup(id);
  }
});

integrationTest("a password set since the cutover is never reverted", async () => {
  const id = await createStrandedAccount();

  try {
    const reset = await hash(RESET_PASSWORD, 10);
    await db.execute(sql`UPDATE public."User" SET "passwordHash" = ${reset} WHERE id = ${id}`);

    await runRescue();
    await runRescue();

    const stored = await passwordHashOf(id);
    assert.ok(stored);
    assert.ok(await compare(RESET_PASSWORD, stored), "the reset password must still work");
    assert.equal(
      await compare(ORIGINAL_PASSWORD, stored),
      false,
      "the pre-cutover password must NOT be resurrected",
    );
  } finally {
    await cleanup(id);
  }
});

integrationTest("the rescue is idempotent — a second run changes nothing", async () => {
  const id = await createStrandedAccount();

  try {
    await runRescue();
    const first = await passwordHashOf(id);
    await runRescue();
    assert.equal(await passwordHashOf(id), first, "a repeat push must be a no-op");
  } finally {
    await cleanup(id);
  }
});

integrationTest("an identity with no real password is left alone, not half-rescued", async () => {
  const id = randomUUID();

  try {
    await db.execute(
      sql`INSERT INTO auth.users (id, email, encrypted_password)
          VALUES (${id}::uuid, ${`${id}@example.com`}, '')`,
    );
    await db.insert(user).values({ displayName: "No password", id, passwordHash: null });

    await runRescue();

    assert.equal(await passwordHashOf(id), null, "must stay NULL so a later rescue can act");
  } finally {
    await cleanup(id);
  }
});

integrationTest("anonymous authors are untouched", async () => {
  const anonymousId = randomUUID();
  const strandedId = await createStrandedAccount();

  try {
    await db.insert(user).values({ displayName: "Anonymous", id: anonymousId });
    assert.equal(await passwordHashOf(anonymousId), null, "precondition: minted without a hash");

    await runRescue();

    assert.ok(await passwordHashOf(strandedId), "the rescue ran and matched its target");
    assert.equal(await passwordHashOf(anonymousId), null);
  } finally {
    await cleanup(anonymousId);
    await cleanup(strandedId);
  }
});
