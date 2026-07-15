/** Guards `packages/db/sql/070-legacy-password-rescue.sql`.
 *
 *  Until 2026-03-10 signup went through Supabase Auth, which hashed the password
 *  into `auth.users.encrypted_password`. Signup then moved to the hand-rolled path,
 *  which reads `User.passwordHash` and nothing else — stranding 485 real accounts
 *  that could no longer sign in. The rescue copies the hash across (GoTrue and this
 *  app are both bcrypt cost 10, so it moves verbatim).
 *
 *  THE FAILURE THIS FILE EXISTS TO CATCH: the rescue re-runs on every push, and its
 *  only safety is `WHERE u."passwordHash" IS NULL`. Delete that predicate and every
 *  push silently reverts every rescued account to the password it had before —
 *  including anyone who reset theirs in the meantime, whose reset was their ONLY
 *  way back in. That is a catastrophic, invisible regression, so the "was not
 *  reverted" case below matters more than the happy path.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { eq, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { user } from "@repo/db/drizzle-schema";
import { compare, hash } from "bcryptjs";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

const RESCUE_SQL = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../db/sql/070-legacy-password-rescue.sql",
);

const ORIGINAL_PASSWORD = "the password they chose in 2025";
const RESET_PASSWORD = "the password they chose after resetting";

after(async () => {
  await db.$client.end();
});

/** `$2a$` is what production's stranded rows actually carry (measured: 485 rows,
    all `$2a$10$`, length 60). bcryptjs emits `$2b$`, so force the prefix — the
    point of the test is that the GoTrue-shaped hash survives the move. */
const gotrueHash = async (password: string) =>
  (await hash(password, 10)).replace(/^\$2[aby]\$/, "$2a$");

const runRescue = async () => {
  await db.execute(sql.raw(await readFile(RESCUE_SQL, "utf8")));
};

/** An identity that signed up through Supabase Auth before the cutover: a row in
    auth.users holding the password, and a User row holding none. */
const createStrandedAccount = async () => {
  const id = randomUUID();
  const encrypted = await gotrueHash(ORIGINAL_PASSWORD);
  await db.execute(
    sql`INSERT INTO auth.users (id, email, encrypted_password)
        VALUES (${id}::uuid, ${`${id}@example.com`}, ${encrypted})`,
  );
  // The insert above fires `on_auth_user_created`, which mirrors the account into
  // public."User" with no passwordHash — exactly how the 485 came to exist.
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
    // They did the only thing available to them: reset their password.
    const reset = await hash(RESET_PASSWORD, 10);
    await db.execute(sql`UPDATE public."User" SET "passwordHash" = ${reset} WHERE id = ${id}`);

    // Every subsequent push re-runs the rescue. It must not touch them.
    await runRescue();
    await runRescue();

    const after = await passwordHashOf(id);
    assert.ok(after);
    assert.ok(await compare(RESET_PASSWORD, after), "the reset password must still work");
    assert.equal(
      await compare(ORIGINAL_PASSWORD, after),
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

integrationTest("anonymous authors are untouched", async () => {
  // They have no auth.users row and `createUserIfNotExists` already gave them a
  // temp hash, so there is nothing here for the rescue to match on.
  const id = randomUUID();
  try {
    await db.execute(
      sql`INSERT INTO public."User" (id, "displayName", "passwordHash") VALUES (${id}, 'Anon', 'temp-hash')`,
    );
    await runRescue();
    assert.equal(await passwordHashOf(id), "temp-hash");
  } finally {
    await cleanup(id);
  }
});
