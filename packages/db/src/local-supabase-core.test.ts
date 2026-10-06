import assert from "node:assert/strict";
import { test } from "node:test";

import { isLoopbackUrl, parseDbUrl, planEnvUpdate, withEnvVar } from "./local-supabase-core";

const LOCAL = "postgresql://postgres:postgres@127.0.0.1:26267/postgres";

test("reads DB_URL out of the CLI's status", () => {
  assert.equal(parseDbUrl(`ANON_KEY='eyJ'\nDB_URL='${LOCAL}'\nSECRET_KEY='sb_secret_x'\n`), LOCAL);
});

test("refuses a status without a DB_URL instead of writing nothing into .env", () => {
  assert.throws(() => parseDbUrl("ANON_KEY='eyJ'\n"), /no DB_URL/u);
  assert.throws(() => parseDbUrl("DB_URL=''\n"), /no DB_URL/u);
});

test("knows a database on this machine from one anywhere else", () => {
  assert.equal(isLoopbackUrl(LOCAL), true);
  assert.equal(isLoopbackUrl("postgresql://postgres:postgres@localhost:5432/postgres"), true);
  assert.equal(isLoopbackUrl("postgresql://postgres:postgres@[::1]:5432/postgres"), true);
  assert.equal(
    isLoopbackUrl("postgresql://postgres.ref:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres"),
    false,
  );
  assert.equal(isLoopbackUrl("not a url"), false);
});

test("rewrites the assignment in place and leaves every other line alone", () => {
  const before = '# Database\nPOSTGRES_URL="postgresql://old@127.0.0.1:54322/postgres"\nA=1\n';
  assert.equal(
    withEnvVar(before, "POSTGRES_URL", LOCAL),
    `# Database\nPOSTGRES_URL="${LOCAL}"\nA=1\n`,
  );
});

test("drops a later duplicate, which dotenv would otherwise let win", () => {
  const before = "POSTGRES_URL=a\nA=1\nexport POSTGRES_URL='b'\n";
  assert.equal(withEnvVar(before, "POSTGRES_URL", LOCAL), `POSTGRES_URL="${LOCAL}"\nA=1\n`);
});

test("appends when there is no assignment, including a commented-out one", () => {
  assert.equal(
    withEnvVar("# POSTGRES_URL=x\nA=1", "POSTGRES_URL", LOCAL),
    `# POSTGRES_URL=x\nA=1\nPOSTGRES_URL="${LOCAL}"\n`,
  );
  assert.equal(withEnvVar("", "POSTGRES_URL", LOCAL), `POSTGRES_URL="${LOCAL}"\n`);
});

test("does not touch a key that only starts with the same name", () => {
  const before = "POSTGRES_URL_NON_POOLING=keep\n";
  assert.equal(withEnvVar(before, "POSTGRES_URL", LOCAL), `${before}POSTGRES_URL="${LOCAL}"\n`);
});

test("repoints a local URL at this branch's database", () => {
  assert.deepEqual(
    planEnvUpdate(
      'POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"\n',
      LOCAL,
    ),
    {
      kind: "write",
      text: `POSTGRES_URL="${LOCAL}"\n`,
    },
  );
});

test("fills in an empty or missing URL", () => {
  assert.deepEqual(planEnvUpdate('POSTGRES_URL=""\n', LOCAL), {
    kind: "write",
    text: `POSTGRES_URL="${LOCAL}"\n`,
  });
  assert.deepEqual(planEnvUpdate("A=1\n", LOCAL), {
    kind: "write",
    text: `A=1\nPOSTGRES_URL="${LOCAL}"\n`,
  });
});

test("leaves .env alone when it already names this database", () => {
  assert.deepEqual(planEnvUpdate(`POSTGRES_URL="${LOCAL}"\n`, LOCAL), { kind: "unchanged" });
});

test("never repoints a database on another host", () => {
  const remote = "postgresql://postgres.ref:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
  assert.deepEqual(planEnvUpdate(`POSTGRES_URL="${remote}"\n`, LOCAL), { kind: "kept-remote" });
});
