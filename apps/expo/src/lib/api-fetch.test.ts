import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { it } from "node:test";

import type { LegacySessionMigrationCheckpoint } from "./legacy-session-migration-core.ts";

it("blocks failed imports, retries, and shares migration before sending session requests", async (t) => {
  const legacy = "signed%2Evalue%3D%3D";
  let stored: string | null = null;
  let checkpoint: LegacySessionMigrationCheckpoint = null;
  let persistenceError: Error | null = null;
  let checkpointError: Error | null = null;
  let readError: Error | null = new Error("native jar unavailable");
  const read = t.mock.fn(() =>
    readError === null ? Promise.resolve(legacy) : Promise.reject(readError),
  );
  const clear = t.mock.fn(() => Promise.reject(new Error("native jar unavailable")));

  const legacyModule = "../../modules/legacy-cookie/src/legacy-cookie-module";
  const imports = registerHooks({
    resolve: (specifier, context, nextResolve) =>
      nextResolve(specifier === legacyModule ? `${specifier}.ts` : specifier, context),
  });
  t.after(() => imports.deregister());
  t.mock.module(legacyModule, {
    exports: { default: { clear, read } },
  });
  t.mock.module("expo-secure-store", {
    exports: {
      deleteItemAsync: () => {
        stored = null;
        return Promise.resolve();
      },
      getItem: (key: string) => (key === "session-cookie" ? stored : checkpoint),
      setItem: (key: string, value: string) => {
        if (key === "session-cookie") {
          if (persistenceError !== null) {
            throw persistenceError;
          }
          stored = value;
        } else {
          if (checkpointError !== null) {
            throw checkpointError;
          }
          assert.ok(value === "cleanup-pending" || value === "complete");
          checkpoint = value;
        }
      },
    },
  });
  const requestHeaders: Headers[] = [];
  const network = t.mock.method(
    globalThis,
    "fetch",
    (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      requestHeaders.push(new Headers(init?.headers));
      assert.equal(init?.credentials, "omit");
      return Promise.resolve(new Response("{}"));
    },
  );
  t.mock.method(console, "warn", () => {});
  const { fetchWithSession } = await import("./api-fetch.ts");
  const endpoint = "https://yourssincerely.org/api/orpc/like/createLike";

  const failedRead = Promise.all([
    assert.rejects(fetchWithSession(endpoint), /native jar unavailable/u),
    assert.rejects(fetchWithSession(endpoint), /native jar unavailable/u),
  ]);
  assert.equal(read.mock.callCount(), 1);
  assert.equal(network.mock.callCount(), 0);
  await failedRead;
  assert.equal(network.mock.callCount(), 0);
  assert.equal(stored, null);
  assert.equal(checkpoint, null);

  readError = null;
  persistenceError = new Error("keychain unavailable");
  const failedWrite = assert.rejects(fetchWithSession(endpoint), /keychain unavailable/u);
  await failedWrite;
  assert.equal(network.mock.callCount(), 0);
  assert.equal(stored, null);
  assert.equal(checkpoint, null);

  persistenceError = null;
  checkpointError = new Error("checkpoint unavailable");
  await assert.rejects(fetchWithSession(endpoint), /checkpoint unavailable/u);
  assert.equal(network.mock.callCount(), 0);
  assert.equal(stored, legacy);
  assert.equal(checkpoint, null);

  checkpointError = null;
  const requests = Promise.all([fetchWithSession(endpoint), fetchWithSession(endpoint)]);
  assert.equal(read.mock.callCount(), 4);
  assert.equal(network.mock.callCount(), 0);
  await requests;
  assert.equal(network.mock.callCount(), 2);
  assert.equal(stored, legacy);
  assert.equal(checkpoint, "cleanup-pending");
  assert.deepEqual(
    requestHeaders.map((headers) => headers.get("cookie")),
    [`__session=${legacy}`, `__session=${legacy}`],
  );

  await fetchWithSession(endpoint);
  assert.equal(read.mock.callCount(), 4);
  assert.equal(network.mock.callCount(), 3);

  const { retireLegacySessionMigration } = await import("./legacy-session-migration.ts");
  checkpointError = new Error("checkpoint unavailable");
  await assert.rejects(retireLegacySessionMigration(), /checkpoint unavailable/u);
  assert.equal(clear.mock.callCount(), 0);
  assert.equal(stored, legacy);
  assert.equal(checkpoint, "cleanup-pending");

  checkpointError = null;
  await retireLegacySessionMigration();
  assert.equal(checkpoint, "complete");
  assert.equal(clear.mock.callCount(), 1);
});
