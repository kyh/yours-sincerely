import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

const nextPackages = ["apps/web/**", "packages/api/**"];

// The Data API is off, so packages/api is the only thing that may hold a
// Postgres connection; every authorization check lives there.
const noDirectDatabase = {
  group: ["@repo/db", "@repo/db/*"],
  message: "Only packages/api talks to Postgres. Go through an oRPC procedure.",
};

export default defineConfig({
  extends: [core, react, antiSlop],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
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
  overrides: [
    { files: nextPackages, plugins: next.plugins, rules: next.rules },
    {
      files: ["apps/expo/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                allowTypeImports: true,
                message:
                  "Type-only: a value import bundles next/headers, bcrypt and postgres into Metro. Shared runtime code belongs in @repo/contracts.",
                name: "@repo/api",
              },
            ],
            patterns: [noDirectDatabase],
          },
        ],
      },
    },
    {
      files: ["apps/web/**", "packages/contracts/**", "packages/ui/**"],
      rules: { "no-restricted-imports": ["error", { patterns: [noDirectDatabase] }] },
    },
  ],
  rules: {
    // Sequential awaits in loops are deliberate here (ordered SQL statements, batched seed writes).
    "no-await-in-loop": "off",
  },
});
