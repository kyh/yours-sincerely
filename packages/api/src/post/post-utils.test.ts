import assert from "node:assert/strict";
import test from "node:test";

import { HEATMAP_DAYS } from "@repo/contracts/calendar";
import { POST_HISTORY_WINDOW_DAYS } from "./post-utils.ts";

test("the post history window covers the widest profile heatmap", () => {
  assert.ok(POST_HISTORY_WINDOW_DAYS >= HEATMAP_DAYS.wide);
});
