import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { palettes } from "./theme-palette.ts";
import type { ThemeColors } from "./theme-palette.ts";

const css = readFileSync(path.join(import.meta.dirname, "..", "styles.css"), "utf-8");
const webCss = readFileSync(
  path.join(import.meta.dirname, "../../../web/src/app/styles/themes.css"),
  "utf-8",
);

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

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const readBlock = (selector: string, source = css): Map<string, string> => {
  const match = new RegExp(`^${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "mu").exec(source);
  assert.ok(match?.[1] !== undefined, `styles.css has no ${selector} block`);
  const variables = new Map<string, string>();
  for (const line of match[1].split("\n")) {
    const declaration = /^\s*(?<name>--[\w-]+):\s*(?<value>[^;]+);/u.exec(line);
    const name = declaration?.groups?.name;
    const value = declaration?.groups?.value;
    if (name !== undefined && value !== undefined) {
      variables.set(name, value);
    }
  }
  return variables;
};

/** `hsl(45 60% 96%)` (CSS) and `hsl(45, 60%, 96%)` (RN) are the same color. */
const normalize = (color: string) => color.replaceAll(/[\s,]/gu, "").toLowerCase();

describe("theme palette", () => {
  for (const [themeId, selector] of CSS_SELECTORS) {
    it(`${themeId} uses the web theme colors`, () => {
      const webVariables = readBlock(selector, webCss);
      const nativeVariables = readBlock(selector);
      for (const [, variable] of CSS_VARIABLES) {
        const expected = webVariables.get(variable);
        const actual = nativeVariables.get(variable);
        assert.ok(expected !== undefined, `Web ${selector} is missing ${variable}`);
        assert.ok(actual !== undefined, `Expo ${selector} is missing ${variable}`);
        assert.equal(normalize(actual), normalize(expected), `${themeId}.${variable}`);
      }
    });

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
