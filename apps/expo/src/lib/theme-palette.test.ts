import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { palettes, type ThemeColors } from "./theme-palette.ts";

const css = readFileSync(path.join(import.meta.dirname, "..", "styles.css"), "utf8");

const CSS_SELECTORS = [
  ["light", ":root"],
  ["dark", ".dark"],
  ["light-purple", ".light-purple"],
  ["dark-purple", ".dark-purple"],
] as const satisfies readonly (readonly [keyof typeof palettes, string])[];

const CSS_VARIABLES = [
  ["background", "--background"],
  ["foreground", "--foreground"],
  ["card", "--card"],
  ["cardForeground", "--card-foreground"],
  ["primary", "--primary"],
  ["primaryForeground", "--primary-foreground"],
  ["secondary", "--secondary"],
  ["muted", "--muted"],
  ["mutedForeground", "--muted-foreground"],
  ["accent", "--accent"],
  ["destructive", "--destructive"],
  ["border", "--border"],
] as const satisfies readonly (readonly [keyof ThemeColors, string])[];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readBlock = (selector: string): Map<string, string> => {
  const match = new RegExp(`^${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "m").exec(css);
  assert.ok(match?.[1] !== undefined, `styles.css has no ${selector} block`);
  const variables = new Map<string, string>();
  for (const line of match[1].split("\n")) {
    const declaration = /^\s*(--[\w-]+):\s*([^;]+);/.exec(line);
    if (declaration?.[1] !== undefined && declaration[2] !== undefined) {
      variables.set(declaration[1], declaration[2]);
    }
  }
  return variables;
};

/** `hsl(45 60% 96%)` (CSS) and `hsl(45, 60%, 96%)` (RN) are the same color. */
const normalize = (color: string) => color.replace(/[\s,]/g, "").toLowerCase();

describe("theme palette", () => {
  for (const [themeId, selector] of CSS_SELECTORS) {
    it(`${themeId} matches the ${selector} block in styles.css`, () => {
      const variables = readBlock(selector);
      const palette = palettes[themeId];
      for (const [key, variable] of CSS_VARIABLES) {
        const expected = variables.get(variable);
        assert.ok(expected !== undefined, `${selector} is missing ${variable}`);
        assert.equal(
          normalize(palette[key]),
          normalize(expected),
          `${themeId}.${key} drifted from ${variable}`,
        );
      }
    });
  }
});
