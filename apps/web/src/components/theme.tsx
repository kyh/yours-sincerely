"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { THEME_IDS, THEME_LABELS } from "@repo/contracts/preferences";
import type { ThemeId } from "@repo/contracts/preferences";

export { isDarkThemeId as isDarkTheme } from "@repo/contracts/preferences";

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

// next-themes only writes color-scheme for the literal "light"/"dark", which
// leaves dark-purple with light native controls; themes.css sets it per class.
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
