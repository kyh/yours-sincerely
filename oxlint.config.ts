import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

const nextPackages = ["apps/web/**", "packages/api/**"];

export default defineConfig({
  extends: [core, react, antiSlop],
  ignorePatterns: [
    ...core.ignorePatterns,
    "dist-electron",
    ".expo",
    ".wxt",
    ".claude",
    ".codex",
    ".superset",
    ".vercel",
    "apps/expo/android",
    "apps/expo/ios",
    "apps/mobile/android",
    "apps/mobile/ios",
    "packages/db/supabase",
  ],
  overrides: [{ files: nextPackages, plugins: next.plugins, rules: next.rules }],
  rules: {
    // Sequential awaits in loops are deliberate here (ordered SQL statements, batched seed writes).
    "no-await-in-loop": "off",
  },
});
