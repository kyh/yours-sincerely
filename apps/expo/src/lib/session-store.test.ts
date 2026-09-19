import assert from "node:assert/strict";
import { it } from "node:test";

it("verifies native session writes and removals before reporting success", async (context) => {
  const persisted = new Map<string, string>();
  let writeSucceeds = true;
  let deleteSucceeds = true;
  context.mock.module("expo-secure-store", {
    exports: {
      deleteItemAsync: (key: string) => {
        if (deleteSucceeds) {
          persisted.delete(key);
        }
        return Promise.resolve();
      },
      getItem: (key: string) => persisted.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (writeSucceeds) {
          persisted.set(key, value);
        }
      },
    },
  });
  const { deleteSessionCookie, getSessionCookie, setSessionCookie } =
    await import("./session-store.ts");
  const session = "signed%2Evalue%3D%3D";
  setSessionCookie(session);
  assert.equal(getSessionCookie(), session);

  writeSucceeds = false;
  assert.throws(() => setSessionCookie("replacement"), /could not be verified/u);
  assert.throws(() => getSessionCookie(), /could not be verified/u);
  assert.equal(persisted.get("session-cookie"), session);

  writeSucceeds = true;
  assert.equal(getSessionCookie(), "replacement");
  assert.equal(persisted.get("session-cookie"), "replacement");

  deleteSucceeds = false;
  await assert.rejects(deleteSessionCookie(), /could not be removed/u);
  assert.equal(getSessionCookie(), "replacement");

  deleteSucceeds = true;
  await deleteSessionCookie();
  assert.equal(getSessionCookie(), null);
});
