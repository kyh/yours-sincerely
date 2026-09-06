import assert from "node:assert/strict";
import test from "node:test";

import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import {
  getPushTokenIdleCutoff,
  type PushDependencies,
  type PushMessage,
  PUSH_TOKEN_MAX_IDLE_DAYS,
  redactPushToken,
  sendPushToUserCore,
} from "./expo-push-core.ts";

const MESSAGE: PushMessage = {
  userId: "user-1",
  title: "Yours Sincerely",
  body: "Someone replied to your letter",
  data: { parentPostId: "p1", commentPostId: "c1" },
};

const tokenFor = (index: number) => `ExponentPushToken[device-${index}]`;

const okTicket = (): ExpoPushTicket => ({ status: "ok", id: "receipt" });
const errorTicket = (
  error: "DeviceNotRegistered" | "MessageTooBig" | "ProviderError",
): ExpoPushTicket => ({ status: "error", message: `Expo said ${error}`, details: { error } });

type Harness = {
  deps: PushDependencies;
  sends: ExpoPushMessage[][];
  deleted: string[];
  logged: string[];
};

const createHarness = (
  tokens: string[],
  respond: (messages: ExpoPushMessage[]) => Promise<ExpoPushTicket[]>,
  chunkSize = 100,
): Harness => {
  const sends: ExpoPushMessage[][] = [];
  const deleted: string[] = [];
  const logged: string[] = [];

  return {
    sends,
    deleted,
    logged,
    deps: {
      findTokens: async () => tokens,
      deleteToken: async (token) => {
        deleted.push(token);
      },
      isExpoPushToken: (token) => token.startsWith("ExponentPushToken["),
      sendChunk: async (messages) => {
        sends.push(messages);
        return respond(messages);
      },
      chunkSize,
      logError: (message) => {
        logged.push(message);
      },
    },
  };
};

const allOk = async (messages: ExpoPushMessage[]) => messages.map(okTicket);

test("sends one message per device with the shared payload", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2)], allOk);

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { sent: 2, pruned: [], failed: 0 });
  assert.equal(harness.sends.length, 1);
  assert.deepEqual(harness.sends[0], [
    {
      to: tokenFor(1),
      title: MESSAGE.title,
      body: MESSAGE.body,
      data: MESSAGE.data,
      sound: "default",
    },
    {
      to: tokenFor(2),
      title: MESSAGE.title,
      body: MESSAGE.body,
      data: MESSAGE.data,
      sound: "default",
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

  assert.deepEqual(outcome, { sent: 0, pruned: [], failed: 0 });
  assert.equal(harness.sends.length, 0);
});

test("DeviceNotRegistered prunes exactly that token, silently", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2), tokenFor(3)], async () => [
    okTicket(),
    errorTicket("DeviceNotRegistered"),
    okTicket(),
  ]);

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { sent: 2, pruned: [tokenFor(2)], failed: 0 });
  assert.deepEqual(harness.deleted, [tokenFor(2)]);
  assert.deepEqual(harness.logged, []);
});

test("other ticket errors keep the token and log once with it redacted", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2)], async () => [
    errorTicket("MessageTooBig"),
    okTicket(),
  ]);

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { sent: 1, pruned: [], failed: 1 });
  assert.deepEqual(harness.deleted, []);
  assert.equal(harness.logged.length, 1);
  const [line] = harness.logged;
  assert.ok(line);
  assert.match(line, /MessageTooBig/);
  assert.ok(!line.includes("device-1"));
});

test("a failed send is swallowed and reported, never thrown", async () => {
  const harness = createHarness([tokenFor(1), tokenFor(2)], async () => {
    throw new Error("expo is down");
  });

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { sent: 0, pruned: [], failed: 2 });
  assert.equal(harness.logged.length, 1);
  assert.match(harness.logged[0] ?? "", /expo is down/);
});

test("a failing token lookup is swallowed too", async () => {
  const harness = createHarness([], allOk);
  harness.deps.findTokens = async () => {
    throw new Error("database gone");
  };

  const outcome = await sendPushToUserCore(MESSAGE, harness.deps);

  assert.deepEqual(outcome, { sent: 0, pruned: [], failed: 0 });
  assert.equal(harness.logged.length, 1);
  assert.match(harness.logged[0] ?? "", /database gone/);
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
