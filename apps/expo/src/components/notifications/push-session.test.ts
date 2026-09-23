import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createPushSession, patchPushSession } from "./push-session.ts";

describe("push session", () => {
  it("starts every account with nothing registered", () => {
    assert.deepEqual(createPushSession("account-a"), {
      expoPushToken: null,
      permission: null,
      registering: false,
      registrationFailed: false,
      userId: "account-a",
    });
    assert.equal(createPushSession(null).userId, null);
  });

  it("applies writes from the account that owns the session", () => {
    const session = patchPushSession("account-a", { registering: true })(
      createPushSession("account-a"),
    );

    assert.equal(session.registering, true);
    assert.equal(session.userId, "account-a");
  });

  it("drops a previous account's late writes after an account change", () => {
    const next = createPushSession("account-b");

    assert.equal(
      patchPushSession("account-a", { expoPushToken: "token", registering: false })(next),
      next,
    );
    assert.equal(
      patchPushSession("account-a", { registrationFailed: true })(createPushSession(null))
        .registrationFailed,
      false,
    );
  });
});
