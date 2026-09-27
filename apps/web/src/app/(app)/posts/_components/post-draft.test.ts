import assert from "node:assert/strict";
import test from "node:test";

import { postDraftKey } from "./post-draft";

test("a letter draft keeps the key existing drafts were saved under", () => {
  assert.equal(postDraftKey(), "post-form");
});

test("each thread's comment draft is stored apart from the letter and from other threads", () => {
  const first = postDraftKey("post-1");
  const second = postDraftKey("post-2");

  assert.notEqual(first, postDraftKey());
  assert.notEqual(first, second);
  assert.equal(first, postDraftKey("post-1"));
});
