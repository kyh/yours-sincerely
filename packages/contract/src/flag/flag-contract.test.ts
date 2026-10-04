import assert from "node:assert/strict";
import test from "node:test";

import { createFlagInput } from "./flag-contract.ts";

test("a blank flag reason is dropped, not stored and not refused", () => {
  for (const reason of ["", "   ", "\n\t"]) {
    assert.equal(createFlagInput.parse({ postId: "p", reason }).reason, undefined);
  }
});

test("a flag reason is trimmed and kept", () => {
  assert.deepEqual(createFlagInput.parse({ postId: "p", reason: "  spam  " }), {
    postId: "p",
    reason: "spam",
  });
});
