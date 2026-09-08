"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ThemeId } from "@repo/contracts/preferences";

export { isDarkThemeId as isDarkTheme } from "@repo/contracts/preferences";

interface ThemeOption {
  id: ThemeId;
  value: ThemeId;
  label: string;
  color: string;
}

export { useTheme } from "next-themes";

export const themes: readonly ThemeOption[] = [
  {
    color: "var(--background)",
    id: "system",
    label: "System",
    value: "system",
  },
  {
    color: "var(--theme-light)",
    id: "light",
    label: "Light",
    value: "light",
  },
  {
    color: "var(--theme-dark)",
    id: "dark",
    label: "Dark",
    value: "dark",
  },
  {
    color: "var(--theme-light-purple)",
    id: "light-purple",
    label: "Light Purple",
    value: "light-purple",
  },
  {
    color: "var(--theme-dark-purple)",
    id: "dark-purple",
    label: "Dark Purple",
    value: "dark-purple",
  },
];

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <NextThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    themes={themes.map((theme) => theme.value)}
  >
    {children}
  </NextThemeProvider>
);
