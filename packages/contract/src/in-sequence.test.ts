import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inSequence } from "./in-sequence.ts";

describe("inSequence", () => {
  it("starts each step after the previous one settles, in order", async () => {
    const events: string[] = [];

    await inSequence(["a", "b", "c"], async (item, index) => {
      events.push(`start ${item}${index}`);
      await Promise.resolve();
      events.push(`end ${item}${index}`);
    });

    assert.deepEqual(events, ["start a0", "end a0", "start b1", "end b1", "start c2", "end c2"]);
  });

  it("stops at the first rejection", async () => {
    const seen: number[] = [];

    await assert.rejects(
      inSequence([1, 2, 3], async (item) => {
        seen.push(item);
        await Promise.resolve();

        if (item === 2) {
          throw new Error("stop");
        }
      }),
      /stop/u,
    );
    assert.deepEqual(seen, [1, 2]);
  });
});
