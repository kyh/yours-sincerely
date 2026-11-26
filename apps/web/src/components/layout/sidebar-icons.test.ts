import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const iconsDir = new URL("../../../public/icons/", import.meta.url);

const expression = /"x"\s*:\s*"/u;

test("sidebar icons carry no expressions, which the light Lottie player silently skips", async () => {
  const entries = await readdir(iconsDir);
  const files = entries.filter((file) => file.endsWith(".json"));
  assert.ok(files.length > 0);

  const icons = await Promise.all(
    files.map(async (file) => ({ file, source: await readFile(new URL(file, iconsDir), "utf-8") })),
  );

  for (const { file, source } of icons) {
    assert.doesNotMatch(source, expression, file);
  }
});
