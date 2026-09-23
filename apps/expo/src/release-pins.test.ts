import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { it } from "node:test";
import { z } from "zod";

const readJson = <Schema extends z.ZodType>(file: string, schema: Schema): z.output<Schema> =>
  schema.parse(JSON.parse(readFileSync(file, "utf-8")));

const appRoot = path.join(import.meta.dirname, "..");

it("EAS installs the same pnpm as the root packageManager", () => {
  const { packageManager } = readJson(
    path.join(appRoot, "../../package.json"),
    z.object({ packageManager: z.string() }),
  );
  const eas = readJson(
    path.join(appRoot, "eas.json"),
    z.object({ build: z.object({ base: z.object({ pnpm: z.string() }) }) }),
  );

  assert.equal(packageManager, `pnpm@${eas.build.base.pnpm}`);
});

// `expo install --check` learns the blessed typescript only from Expo's versions
// API, so it runs in CI alone; this keeps the pin inside the offline `pnpm verify`.
it("Expo resolves the SDK-blessed TypeScript 6", () => {
  const require = createRequire(import.meta.url);
  const { version } = readJson(
    require.resolve("typescript/package.json"),
    z.object({ version: z.string() }),
  );

  assert.match(version, /^6\./u);
});
