import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { it } from "node:test";

it("blocks a missing native bridge in release builds and tolerates older development clients", async (t) => {
  const previousDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  t.after(() => {
    if (previousDev === undefined) {
      Reflect.deleteProperty(globalThis, "__DEV__");
    } else {
      Object.defineProperty(globalThis, "__DEV__", previousDev);
    }
  });
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: false });
  const legacyModule = "../../modules/legacy-cookie/src/legacy-cookie-module";
  const imports = registerHooks({
    resolve: (specifier, context, nextResolve) =>
      nextResolve(specifier === legacyModule ? `${specifier}.ts` : specifier, context),
  });
  t.after(() => imports.deregister());
  t.mock.module(legacyModule, {
    exports: { default: null },
  });
  const writeCheckpoint = t.mock.fn();
  t.mock.module("expo-secure-store", {
    exports: {
      deleteItemAsync: () => Promise.resolve(),
      getItem: () => null,
      setItem: writeCheckpoint,
    },
  });
  t.mock.method(console, "warn", () => {});
  const network = t.mock.method(globalThis, "fetch", () => Promise.resolve(new Response("{}")));
  const { fetchWithSession } = await import("./api-fetch.ts");
  const endpoint = "https://yourssincerely.org/api/orpc/auth/workspace";

  await assert.rejects(fetchWithSession(endpoint), /migration is unavailable/u);
  assert.equal(network.mock.callCount(), 0);
  assert.equal(writeCheckpoint.mock.callCount(), 0);

  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  await fetchWithSession(endpoint);
  assert.equal(network.mock.callCount(), 1);
  assert.equal(writeCheckpoint.mock.callCount(), 0);
});
