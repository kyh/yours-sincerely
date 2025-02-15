"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

export { useTheme } from "next-themes";

export const themes = [
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

export const isDarkTheme = (theme?: string) =>
  theme ? theme.includes("dark") : false;

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
