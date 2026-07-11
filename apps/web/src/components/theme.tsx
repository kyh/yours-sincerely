"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { isDarkThemeId, type ThemeId } from "@repo/contracts/preferences";

type ThemeOption = { id: ThemeId; value: ThemeId; label: string; color: string };

export { useTheme } from "next-themes";

export const themes: readonly ThemeOption[] = [
  {
    id: "system",
    value: "system",
    label: "System",
    color: "var(--background)",
  },
  {
    id: "light",
    value: "light",
    label: "Light",
    color: "var(--theme-light)",
  },
  {
    id: "dark",
    value: "dark",
    label: "Dark",
    color: "var(--theme-dark)",
  },
  {
    id: "light-purple",
    value: "light-purple",
    label: "Light Purple",
    color: "var(--theme-light-purple)",
  },
  {
    id: "dark-purple",
    value: "dark-purple",
    label: "Dark Purple",
    color: "var(--theme-dark-purple)",
  },
];

export const isDarkTheme = isDarkThemeId;

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={themes.map((theme) => theme.value)}
    >
      {children}
    </NextThemeProvider>
  );
};
