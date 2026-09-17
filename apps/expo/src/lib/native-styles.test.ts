import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { it } from "node:test";
import tailwind from "@tailwindcss/postcss";
import type * as CSSCompiler from "react-native-css/compiler";
import type * as CSSUtilities from "react-native-css/utilities";

import type * as NativeStyles from "../../node_modules/react-native-css/dist/typescript/commonjs/src/native/styles/calculate-props.js";

type TailwindPlugin = ReturnType<typeof tailwind>;
type Processor = Extract<TailwindPlugin, { process: unknown }>;

// Match Metro's CommonJS compiler entry and Tailwind's own PostCSS processor.
const require = createRequire(import.meta.url);
const { compile }: typeof CSSCompiler = require("react-native-css/compiler");
const { specificityCompareFn }: typeof CSSUtilities = require("react-native-css/utilities");
const postcss: (plugins: TailwindPlugin[]) => Processor = createRequire(
  import.meta.resolve("@tailwindcss/postcss"),
)("postcss");

it("the Tailwind-to-native pipeline preserves web typography, spacing, and radii", async (context) => {
  // Run the installed native resolver; only its native environment is mocked.
  context.mock.module(require.resolve("react-native"), {
    exports: {
      Appearance: {
        addChangeListener: () => null,
        getColorScheme: () => "light",
      },
      Dimensions: {
        addEventListener: () => null,
        get: () => ({ height: 844, width: 390 }),
      },
      Platform: { OS: "ios" },
      PlatformColor: () => "black",
    },
  });
  const { calculateProps }: typeof NativeStyles = require(
    path.join(
      path.dirname(require.resolve("react-native-css/compiler")),
      "../native/styles/calculate-props.js",
    ),
  );
  const from = path.join(import.meta.dirname, "..", "styles.css");
  for (const optimize of [false, true]) {
    const output = await postcss([tailwind({ optimize })]).process(
      `${readFileSync(from, "utf-8")}\n@source inline("text-base leading-6 px-5 min-h-11 rounded-xl rounded-2xl size-3 size-4");`,
      { from },
    );
    const utilities = new Map(compile(output.css).stylesheet().s);
    assert.deepEqual(utilities.get("px-5")?.[0]?.d, [{ paddingInline: 20 }]);
    assert.deepEqual(utilities.get("min-h-11")?.[0]?.d, [{ minHeight: 44 }]);
    assert.deepEqual(utilities.get("rounded-xl")?.[0]?.d, [{ borderRadius: 11.2 }]);
    assert.deepEqual(utilities.get("rounded-2xl")?.[0]?.d, [{ borderRadius: 14.4 }]);
    // Tailwind and NativeWind emit separate leading-6 rules. Resolve the full cascade.
    const typography = [
      ...(utilities.get("text-base") ?? []),
      ...(utilities.get("leading-6") ?? []),
    ].toSorted(specificityCompareFn);
    assert.deepEqual(calculateProps((observable) => observable.get(), typography).normal, {
      style: { fontSize: 16, lineHeight: 24 },
    });
    for (const [className, size] of new Map([
      ["size-3", 12],
      ["size-4", 16],
    ])) {
      assert.deepEqual(
        calculateProps((observable) => observable.get(), utilities.get(className) ?? []).normal,
        { style: { height: size, width: size } },
      );
    }
  }
});
