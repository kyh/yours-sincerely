"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { THEME_IDS, THEME_LABELS } from "@repo/contract/client/preferences";
import type { ThemeId } from "@repo/contract/client/preferences";

export { isDarkThemeId as isDarkTheme } from "@repo/contract/client/preferences";

export { useTheme } from "next-themes";

const themeColors = {
  dark: "var(--theme-dark)",
  "dark-purple": "var(--theme-dark-purple)",
  light: "var(--theme-light)",
  "light-purple": "var(--theme-light-purple)",
  system: "var(--background)",
} satisfies Record<ThemeId, string>;

export const themes = THEME_IDS.map((id) => ({
  color: themeColors[id],
  id,
  label: THEME_LABELS[id],
}));

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <NextThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    enableColorScheme={false}
    themes={themes.map((theme) => theme.id)}
  >
    {children}
  </NextThemeProvider>
);
