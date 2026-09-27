import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const iconsDir = new URL("../../../public/icons/", import.meta.url);

// Bodymovin writes an After Effects expression as a string-valued "x" key;
// numeric "x" keys (easing handles) are plain keyframe data.
const expression = /"x"\s*:\s*"/u;

test("sidebar icons carry no expressions, which the light Lottie player silently skips", async () => {
  const entries = await readdir(iconsDir);
  const files = entries.filter((file) => file.endsWith(".json"));
  assert.ok(files.length > 0);
  for (const file of files) {
    assert.doesNotMatch(await readFile(new URL(file, iconsDir), "utf-8"), expression, file);
  }
});
