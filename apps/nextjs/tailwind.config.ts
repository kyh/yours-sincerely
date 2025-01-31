import type { Config } from "tailwindcss";
import baseConfig from "@init/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/mdx/src/**/*.{ts,tsx}",
    "../../packages/data-table/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
} satisfies Config;
