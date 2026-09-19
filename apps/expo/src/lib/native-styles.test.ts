import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { it } from "node:test";
import tailwind from "@tailwindcss/postcss";
import type * as CSSCompiler from "react-native-css/compiler";
import type * as CSSUtilities from "react-native-css/utilities";
import type * as NativeRegistry from "react-native-css/native-internal";

import type * as NativeGuards from "../../node_modules/react-native-css/dist/typescript/commonjs/src/native/conditions/guards.js";
import type * as NativeRules from "../../node_modules/react-native-css/dist/typescript/commonjs/src/native/react/rules.js";
import type * as NativeReactivity from "../../node_modules/react-native-css/dist/typescript/commonjs/src/native/reactivity.js";
import type * as NativeStyles from "../../node_modules/react-native-css/dist/typescript/commonjs/src/native/styles/calculate-props.js";
import type * as NativeProps from "../../node_modules/react-native-css/dist/typescript/commonjs/src/native/styles/index.js";

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
  const nativePath = path.join(path.dirname(require.resolve("react-native-css/compiler")), "..");
  const { calculateProps }: typeof NativeStyles = require(
    path.join(nativePath, "native/styles/calculate-props.js"),
  );
  const { StyleCollection }: typeof NativeRegistry = require("react-native-css/native-internal");
  const { updateRules }: typeof NativeRules = require(
    path.join(nativePath, "native/react/rules.js"),
  );
  const { testGuards }: typeof NativeGuards = require(
    path.join(nativePath, "native/conditions/guards.js"),
  );
  const { getStyledProps }: typeof NativeProps = require(
    path.join(nativePath, "native/styles/index.js"),
  );
  const reactivity: typeof NativeReactivity = require(
    path.join(nativePath, "native/reactivity.js"),
  );
  const createState = (): Parameters<typeof updateRules>[0] => {
    const effect: NativeReactivity.Effect = { observers: new Set(), run: () => null };
    return {
      configs: [{ source: "className", target: "style" }],
      inheritedContainers: {},
      inheritedVariables: { [reactivity.VAR_SYMBOL]: true },
      pressable: false,
      ruleEffect: effect,
      ruleEffectGetter: (observable) => observable.get(effect),
      styleEffect: effect,
    };
  };
  const from = path.join(import.meta.dirname, "..", "styles.css");
  for (const optimize of [false, true]) {
    const output = await postcss([tailwind({ optimize })]).process(
      `${readFileSync(from, "utf-8")}\n@source inline("text-base leading-6 px-5 min-h-11 rounded-xl rounded-2xl size-3 size-4 bg-background bg-card text-foreground bg-input");`,
      { from },
    );
    const stylesheet = compile(output.css).stylesheet();
    const utilities = new Map(stylesheet.s);
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

    await context.test(`theme colors propagate without remounting (optimize=${optimize})`, () => {
      StyleCollection.inject(stylesheet);
      let root = createState();
      const { inheritedVariables, inheritedContainers } = root;
      const children = ["bg-background", "bg-card", "text-foreground", "bg-input"].map(
        (className) => ({
          props: { className },
          state: createState(),
        }),
      );
      // Keep the same child states. Remounting hides missing inherited-variable guards.
      for (const [theme, background, card, foreground, input] of [
        ["light", "#fbf8ef", "#fafaf9", "#23231f", "#e4e4e7"],
        ["dark", "#0e0e0c", "#1a1a1a", "#fafafa", "#ffffff26"],
        ["light-purple", "#f0edf7", "#fafaf9", "#190840", "#e4e4e7"],
        ["dark-purple", "#1e293b", "#0f172a", "#fafafa", "#e4e4e7"],
        ["light", "#fbf8ef", "#fafaf9", "#23231f", "#e4e4e7"],
      ]) {
        const props = {
          accessible: false,
          className: `will-change-variable will-change-container flex-1 light ${theme}`,
          focusable: false,
        };
        root = updateRules(root, props, inheritedVariables, inheritedContainers, true, false);
        const { variables, containers } = root;
        assert.ok(variables);
        assert.ok(containers);
        const rootProps = getStyledProps(root, props);
        assert.ok(rootProps?.onPress);
        assert.equal(rootProps?.accessible, false);
        assert.equal(rootProps?.focusable, false);
        const styles = children.map((child) => {
          if (
            child.state.guards === undefined ||
            testGuards(child.state, child.props, variables, containers)
          ) {
            child.state = updateRules(child.state, child.props, variables, containers, true, false);
          }
          return getStyledProps(child.state, child.props)?.style;
        });
        assert.deepEqual(styles, [
          { backgroundColor: background },
          { backgroundColor: card },
          { color: foreground },
          { backgroundColor: input },
        ]);
      }
    });
  }
});
