import assert from "node:assert/strict";
import test from "node:test";

import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import {
  getPushTokenIdleCutoff,
  PUSH_TOKEN_MAX_IDLE_DAYS,
  redactPushToken,
  sendPushToUserCore,
} from "./expo-push-core.ts";
import type { PushDependencies, PushMessage } from "./expo-push-core.ts";

const MESSAGE: PushMessage = {
  body: "Someone replied to your letter",
  data: { commentPostId: "c1", parentPostId: "p1" },
  title: "Yours Sincerely",
  userId: "user-1",
};

const tokenFor = (index: number) => `ExponentPushToken[device-${index}]`;

const okTicket = (): ExpoPushTicket => ({ id: "receipt", status: "ok" });
const errorTicket = (
  error: "DeviceNotRegistered" | "MessageTooBig" | "ProviderError",
): ExpoPushTicket => ({ details: { error }, message: `Expo said ${error}`, status: "error" });

interface Harness {
  deps: PushDependencies;
  sends: ExpoPushMessage[][];
  deleted: string[];
  logged: string[];
}

const createHarness = (
  tokens: string[],
  respond: (messages: ExpoPushMessage[]) => Promise<ExpoPushTicket[]>,
  chunkSize = 100,
): Harness => {
  const sends: ExpoPushMessage[][] = [];
  const deleted: string[] = [];
  const logged: string[] = [];

  return {
    deleted,
    deps: {
      chunkSize,
      deleteToken: (token) => {
        deleted.push(token);
        return Promise.resolve();
      },
      findTokens: () => Promise.resolve(tokens),
      isExpoPushToken: (token) => token.startsWith("ExponentPushToken["),
      logError: (message) => {
        logged.push(message);
      },
      sendChunk: (messages) => {
        sends.push(messages);
        return respond(messages);
      },
    },
    logged,
    sends,
  };
};

const allOk = (messages: ExpoPushMessage[]) => Promise.resolve(messages.map(okTicket));

test("sends one message per device with the shared payload", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2)], allOk);

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { failed: 0, pruned: [], sent: 2 });
  assert.equal(harness.sends.length, 1);
  assert.deepEqual(harness.sends[0], [
    {
      body: MESSAGE.body,
      data: MESSAGE.data,
      sound: "default",
      title: MESSAGE.title,
      to: tokenFor(1),
    },
    {
      body: MESSAGE.body,
      data: MESSAGE.data,
      sound: "default",
      title: MESSAGE.title,
      to: tokenFor(2),
    },
  ]);
});

test("chunks at Expo's per-request limit", async () => {
  const tokens = Array.from({ length: 250 }, (_, index) => tokenFor(index));
  const harness = createHarness(tokens, allOk, 100);

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.equal(outcome.sent, 250);
  assert.deepEqual(
    harness.sends.map((chunk) => chunk.length),
    [100, 100, 50],
  );
  assert.deepEqual(
    harness.sends.flat().map((message) => message.to),
    tokens,
  );
});

test("skips tokens that are not Expo push tokens and sends nothing for none", async () => {
  const harness = createHarness(["apns:raw-device-token", "junk"], allOk);

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { failed: 0, pruned: [], sent: 0 });
  assert.equal(harness.sends.length, 0);
});

test("DeviceNotRegistered prunes exactly that token, silently", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2), tokenFor(3)], () =>
    Promise.resolve([okTicket(), errorTicket("DeviceNotRegistered"), okTicket()]),
  );

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { failed: 0, pruned: [tokenFor(2)], sent: 2 });
  assert.deepEqual(harness.deleted, [tokenFor(2)]);
  assert.deepEqual(harness.logged, []);
});

test("other ticket errors keep the token and log once with it redacted", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2)], () =>
    Promise.resolve([errorTicket("MessageTooBig"), okTicket()]),
  );

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { failed: 1, pruned: [], sent: 1 });
  assert.deepEqual(harness.deleted, []);
  assert.equal(harness.logged.length, 1);
  const [line] = harness.logged;
  assert.ok(line);
  assert.match(line, /MessageTooBig/u);
  assert.ok(!line.includes("device-1"));
});

test("a failed send is swallowed and reported, never thrown", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2)], () =>
    Promise.reject(new Error("expo is down")),
  );

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { failed: 2, pruned: [], sent: 0 });
  assert.equal(harness.logged.length, 1);
  assert.match(harness.logged[0] ?? "", /expo is down/u);
});

test("a failing token lookup is swallowed too", async () => {
  const harness = createHarness([], allOk);
  harness.deps.findTokens = () => Promise.reject(new Error("database gone"));

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { failed: 0, pruned: [], sent: 0 });
  assert.equal(harness.logged.length, 1);
  assert.match(harness.logged[0] ?? "", /database gone/u);
});

test("the idle cut-off is PUSH_TOKEN_MAX_IDLE_DAYS before now, as a timestamp string", () => {
  assert.equal(PUSH_TOKEN_MAX_IDLE_DAYS, 90);
  assert.equal(
    getPushTokenIdleCutoff(new Date("2026-09-05T12:00:00.000Z")),
    "2026-06-07T12:00:00.000Z",
  );
});

test("redaction keeps the token family and drops the device id", () => {
  assert.equal(redactPushToken("ExponentPushToken[abc-123]"), "ExponentPushToken[…]");
  assert.equal(redactPushToken("ExpoPushToken[xyz]"), "ExpoPushToken[…]");
});
