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
    id: "pastel-purple",
    value: "pastel-purple",
    label: "Pastel Purple",
    color: "var(--theme-pastel-purple)",
  },
  {
    id: "dark-purple",
    value: "dark-purple",
    label: "Dark Purple",
    color: "var(--theme-dark-purple)",
  },
];

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
