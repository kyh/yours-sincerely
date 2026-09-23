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

const readBlock = (selector: string, source = css): Map<string, string> => {
  const blocks = [
    ...source.matchAll(/^(?<selectors>[.:][\w-]+(?:\s*,\s*[.:][\w-]+)*)\s*\{(?<body>[^{}]*)\}/gmu),
  ].filter((match) => match.groups?.selectors?.split(",").some((item) => item.trim() === selector));
  assert.ok(blocks.length > 0, `styles.css has no ${selector} block`);
  const variables = new Map<string, string>();
  for (const block of blocks) {
    assert.ok(block.groups?.body !== undefined);
    for (const line of block.groups.body.split("\n")) {
      const declaration = /^\s*(?<name>--[\w-]+):\s*(?<value>[^;]+);/u.exec(line);
      const name = declaration?.groups?.name;
      const value = declaration?.groups?.value;
      if (name !== undefined && value !== undefined) {
        variables.set(name, value);
      }
    }
  }
  return variables;
};

/** `hsl(45 60% 96%)` (CSS) and `hsl(45, 60%, 96%)` (RN) are the same color. */
const normalize = (color: string) => color.replaceAll(/[\s,]/gu, "").toLowerCase();

// Not `mutedForeground` on `muted`: only the avatar fallback, shown while the image
// loads, puts it there, and light-purple's mid-tone muted cannot reach AA without a redesign.
const TEXT_ON_SURFACES = [
  ["foreground", ["background"]],
  ["cardForeground", ["card"]],
  ["primaryForeground", ["primary"]],
  ["primary", ["background", "card"]],
  ["mutedForeground", ["background", "card", "accent"]],
  ["destructive", ["background", "card"]],
] as const satisfies readonly (readonly [keyof ThemeColors, readonly (keyof ThemeColors)[]])[];

/** WCAG 2 relative luminance of an opaque `hsl(h, s%, l%)` palette value. */
const luminance = (color: string) => {
  const groups = /^hsl\((?<h>[\d.]+),\s*(?<s>[\d.]+)%,\s*(?<l>[\d.]+)%\)$/u.exec(color)?.groups;
  const [h, s, l] = [groups?.h, groups?.s, groups?.l];
  assert.ok(h !== undefined && s !== undefined && l !== undefined, `${color} is not opaque hsl()`);
  const hue = Number(h);
  const lightness = Number(l) / 100;
  const chroma = (Number(s) / 100) * Math.min(lightness, 1 - lightness);
  const linear = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    const value = lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(0) + 0.7152 * linear(8) + 0.0722 * linear(4);
};

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

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

    it(`${themeId} text tokens meet WCAG AA (4.5:1) on their surfaces`, () => {
      const palette = palettes[themeId];
      for (const [text, surfaces] of TEXT_ON_SURFACES) {
        for (const surface of surfaces) {
          const ratio = contrast(palette[text], palette[surface]);
          assert.ok(ratio >= 4.5, `${themeId}.${text} on ${surface} is ${ratio.toFixed(2)}:1`);
        }
      }
    });
  }
});
