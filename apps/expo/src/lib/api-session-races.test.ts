import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { it } from "node:test";

interface PendingRequest {
  cookie: string | null;
  pathname: string;
  respond: (cookie?: string) => void;
  reject: (error: Error) => void;
}

it("keeps identity changes ordered without serializing ordinary reads", async (context) => {
  const persisted = new Map<string, string>();
  let writeError: Error | null = null;
  let retirementError: Error | null = null;
  let delayDeletion = false;
  let delayRetirement = false;
  let deletionCount = 0;
  const pendingDeletions: (() => void)[] = [];
  const pendingRetirements: (() => void)[] = [];
  context.mock.module("expo-secure-store", {
    exports: {
      deleteItemAsync: async (key: string) => {
        deletionCount += 1;
        if (delayDeletion) {
          // oxlint-disable-next-line promise/avoid-new -- Hold native deletion until a competing request starts.
          await new Promise<void>((resolve) => {
            pendingDeletions.push(resolve);
          });
        }
        persisted.delete(key);
      },
      getItem: (key: string) => persisted.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (writeError !== null) {
          throw writeError;
        }
        persisted.set(key, value);
      },
    },
  });
  context.mock.module("./legacy-session-migration.ts", {
    exports: {
      ensureLegacySessionMigrated: () => Promise.resolve("complete"),
      retireLegacySessionMigration: async () => {
        if (retirementError !== null) {
          throw retirementError;
        }
        if (delayRetirement) {
          // oxlint-disable-next-line promise/avoid-new -- Change the session generation while retirement is suspended.
          await new Promise<void>((resolve) => {
            pendingRetirements.push(resolve);
          });
        }
      },
    },
  });
  const pending: PendingRequest[] = [];
  context.mock.method(
    globalThis,
    "fetch",
    (input: Parameters<typeof fetch>[0], init?: RequestInit) =>
      // oxlint-disable-next-line promise/avoid-new -- Deferred responses exercise out-of-order network delivery.
      new Promise<Response>((resolve, reject) => {
        pending.push({
          cookie: new Headers(init?.headers).get("cookie"),
          pathname: new URL(input instanceof Request ? input.url : input).pathname,
          reject,
          respond: (cookie) => {
            resolve(
              new Response("{}", { headers: cookie === undefined ? {} : { "set-cookie": cookie } }),
            );
          },
        });
      }),
  );
  const { fetchWithSession } = await import("./api-fetch.ts");
  const { deleteSessionCookie, getSessionCookie, setSessionCookie } =
    await import("./session-store.ts");
  const request = (procedure: string) =>
    fetchWithSession(`https://yourssincerely.org/api/orpc/${procedure}`, { method: "POST" });
  const requestAt = (index: number) => {
    const value = pending[index];
    assert.ok(value);
    return value;
  };

  await context.test("caller headers cannot override the stored session", async () => {
    const url = "https://yourssincerely.org/api/orpc/auth/workspace";
    const requestInput = new Request(url, { headers: { cookie: "__session=caller" } });
    const fromRequest = fetchWithSession(requestInput);
    const fromInit = fetchWithSession(url, { headers: { cookie: "__session=caller" } });
    await setImmediate();
    assert.equal(requestAt(0).cookie, null);
    assert.equal(requestAt(1).cookie, null);
    requestAt(0).respond();
    requestAt(1).respond();
    await Promise.all([fromRequest, fromInit]);
    pending.length = 0;
  });

  await context.test("ordinary reads remain concurrent", async () => {
    const feed = request("post/getFeed");
    const workspace = request("auth/workspace");
    await setImmediate();
    assert.equal(pending.length, 2);
    requestAt(0).respond();
    requestAt(1).respond();
    await Promise.all([feed, workspace]);
    pending.length = 0;
  });

  for (const initial of [null, "revoked-session"]) {
    await context.test(`first writes share identity with initial cookie ${initial}`, async () => {
      if (initial === null) {
        await deleteSessionCookie();
      } else {
        setSessionCookie(initial);
      }
      const post = request("post/createPost");
      const like = request("like/createLike");
      const workspace = request("auth/workspace");
      await setImmediate();
      assert.equal(pending.length, 1);
      assert.equal(requestAt(0).cookie, initial === null ? null : `__session=${initial}`);
      requestAt(0).respond("__session=anonymous%2Eauthor%3D; Path=/");
      await post;
      await setImmediate();
      assert.equal(pending.length, 2);
      assert.equal(requestAt(1).pathname, "/api/orpc/like/createLike");
      assert.equal(requestAt(1).cookie, "__session=anonymous%2Eauthor%3D");
      requestAt(1).respond();
      await like;
      await setImmediate();
      assert.equal(requestAt(2).cookie, "__session=anonymous%2Eauthor%3D");
      requestAt(2).respond();
      await workspace;
      assert.equal(getSessionCookie(), "anonymous%2Eauthor%3D");
      assert.equal(persisted.get("session-cookie"), "anonymous%2Eauthor%3D");
      pending.length = 0;

      // Sign-up receives the durable anonymous identity, so the backend updates that user.
      const signup = request("auth/signUp");
      await setImmediate();
      assert.equal(requestAt(0).cookie, "__session=anonymous%2Eauthor%3D");
      requestAt(0).respond("__session=registered%2Eauthor%3D; Path=/");
      await signup;
      assert.equal(getSessionCookie(), "registered%2Eauthor%3D");
      pending.length = 0;
    });
  }

  for (const renewalFirst of [false, true]) {
    await context.test(`sign-in wins over old renewal, renewal first ${renewalFirst}`, async () => {
      setSessionCookie("old-account");
      const feed = request("post/getFeed");
      await setImmediate();
      const signin = request("auth/signInWithPassword");
      await setImmediate();
      assert.equal(pending.length, 2);
      if (renewalFirst) {
        requestAt(0).respond("__session=renewed-old-account; Path=/");
        await feed;
      }
      requestAt(1).respond("__session=new-account; Path=/");
      await signin;
      if (!renewalFirst) {
        requestAt(0).respond("__session=renewed-old-account; Path=/");
        await feed;
      }
      assert.equal(getSessionCookie(), "new-account");
      pending.length = 0;
    });
  }

  for (const procedure of ["auth/signOut", "auth/signOutEverywhere"]) {
    await context.test(`${procedure} cannot be undone by an older response`, async () => {
      setSessionCookie("old-account");
      const feed = request("post/getFeed");
      await setImmediate();
      const signout = request(procedure);
      await setImmediate();
      requestAt(1).respond("__session=; Max-Age=0; Path=/");
      await signout;
      requestAt(0).respond("__session=renewed-old-account; Path=/");
      await feed;
      assert.equal(getSessionCookie(), null);
      pending.length = 0;
    });
  }

  await context.test("local signout also invalidates outstanding response cookies", async () => {
    setSessionCookie("old-account");
    const feed = request("post/getFeed");
    await setImmediate();
    await deleteSessionCookie();
    requestAt(0).respond("__session=renewed-old-account; Path=/");
    await feed;
    assert.equal(getSessionCookie(), null);
    pending.length = 0;
  });

  await context.test("a failed identity request releases queued work", async () => {
    const signin = request("auth/signInWithPassword");
    const failed = assert.rejects(signin, /offline/u);
    const post = request("post/createPost");
    await setImmediate();
    assert.equal(pending.length, 1);
    requestAt(0).reject(new Error("offline"));
    await failed;
    await setImmediate();
    assert.equal(pending.length, 2);
    requestAt(1).respond("__session=new-author; Path=/");
    await post;
    assert.equal(getSessionCookie(), "new-author");
    pending.length = 0;
  });

  await context.test(
    "a failed first-cookie write blocks traffic until the same cookie is durable",
    async () => {
      await deleteSessionCookie();
      const post = request("post/createPost");
      const failed = assert.rejects(post, /keychain locked/u);
      await setImmediate();
      writeError = new Error("keychain locked");
      requestAt(0).respond("__session=uncommitted%2Eauthor%3D; Path=/");
      await failed;
      assert.equal(persisted.get("session-cookie"), undefined);
      await assert.rejects(request("like/createLike"), /keychain locked/u);
      assert.equal(pending.length, 1);

      writeError = null;
      const like = request("like/createLike");
      await setImmediate();
      assert.equal(requestAt(1).cookie, "__session=uncommitted%2Eauthor%3D");
      assert.equal(persisted.get("session-cookie"), "uncommitted%2Eauthor%3D");
      requestAt(1).respond();
      await like;
      pending.length = 0;
    },
  );

  await context.test("signout preserves the cookie until legacy retirement succeeds", async () => {
    setSessionCookie("legacy-author");
    retirementError = new Error("checkpoint unavailable");
    const signout = request("auth/signOut");
    const failed = assert.rejects(signout, /checkpoint unavailable/u);
    await setImmediate();
    requestAt(0).respond("__session=; Max-Age=0; Path=/");
    await failed;
    assert.equal(getSessionCookie(), "legacy-author");

    retirementError = null;
    const retry = request("auth/signOut");
    await setImmediate();
    requestAt(1).respond("__session=; Max-Age=0; Path=/");
    await retry;
    assert.equal(getSessionCookie(), null);
    pending.length = 0;
  });

  await context.test(
    "expiry does not delete again after identity changes during retirement",
    async () => {
      setSessionCookie("legacy-author");
      delayRetirement = true;
      const signout = request("auth/signOut");
      await setImmediate();
      requestAt(0).respond("__session=; Max-Age=0; Path=/");
      await setImmediate();
      const completeRetirement = pendingRetirements.shift();
      assert.ok(completeRetirement);
      const previousDeletions = deletionCount;
      await deleteSessionCookie();
      completeRetirement();
      await signout;
      assert.equal(deletionCount, previousDeletions + 1);
      assert.equal(getSessionCookie(), null);
      delayRetirement = false;
      pending.length = 0;
    },
  );

  await context.test("a new sign-in waits until an earlier native deletion finishes", async () => {
    setSessionCookie("old-account");
    delayDeletion = true;
    const deletion = deleteSessionCookie();
    const signin = request("auth/signInWithPassword");
    await setImmediate();
    assert.equal(pending.length, 0);
    const completeDeletion = pendingDeletions.shift();
    assert.ok(completeDeletion);
    completeDeletion();
    await deletion;
    await setImmediate();
    assert.equal(requestAt(0).cookie, null);
    requestAt(0).respond("__session=new-account; Path=/");
    await signin;
    assert.equal(getSessionCookie(), "new-account");
    delayDeletion = false;
  });
});
