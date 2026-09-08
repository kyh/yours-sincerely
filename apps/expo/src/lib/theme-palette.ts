import type { ResolvedThemeId } from "@repo/contracts/preferences";

/** Raw palette values for props NativeWind classes can't reach
    (placeholderTextColor, SVG fills, navigation themes, spinners).
    `theme-palette.test.ts` holds these equal to the variables in
    src/styles.css, which is the copy NativeWind compiles. */
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  destructive: string;
  border: string;
}

const light: ThemeColors = {
  accent: "hsl(47, 27%, 87%)",
  background: "hsl(45, 60%, 96%)",
  border: "hsl(60, 6%, 85%)",
  card: "hsl(34, 10%, 98%)",
  cardForeground: "hsl(60, 6%, 13%)",
  destructive: "hsl(358, 72%, 59%)",
  foreground: "hsl(60, 6%, 13%)",
  muted: "hsl(47, 27%, 87%)",
  mutedForeground: "hsl(60, 6%, 60%)",
  primary: "hsl(60, 6%, 13%)",
  primaryForeground: "hsl(34, 10%, 98%)",
  secondary: "hsl(47, 27%, 87%)",
};

const dark: ThemeColors = {
  accent: "hsl(60, 6%, 17%)",
  background: "hsl(60, 6%, 5%)",
  border: "hsl(60, 6%, 17%)",
  card: "hsl(0, 0%, 10%)",
  cardForeground: "hsl(0, 0%, 98%)",
  destructive: "hsl(0, 62.8%, 30.6%)",
  foreground: "hsl(0, 0%, 98%)",
  muted: "hsl(60, 6%, 17%)",
  mutedForeground: "hsl(60, 6%, 50%)",
  primary: "hsl(0, 0%, 98%)",
  primaryForeground: "hsl(0, 0%, 10%)",
  secondary: "hsl(60, 6%, 17%)",
};

const lightPurple: ThemeColors = {
  accent: "hsl(260, 19%, 90%)",
  background: "hsl(256, 40%, 95%)",
  border: "hsl(258, 22%, 76%)",
  card: "hsl(34, 10%, 98%)",
  cardForeground: "hsl(258, 78%, 14%)",
  destructive: "hsl(358, 72%, 59%)",
  foreground: "hsl(258, 78%, 14%)",
  muted: "hsl(260, 19%, 76%)",
  mutedForeground: "hsl(258, 16%, 58%)",
  primary: "hsl(236, 61%, 70%)",
  primaryForeground: "hsl(34, 10%, 98%)",
  secondary: "hsl(260, 19%, 76%)",
};

const darkPurple: ThemeColors = {
  accent: "hsl(215.29, 25%, 26.67%)",
  background: "hsl(217.24, 32.58%, 17.45%)",
  border: "hsl(215.29, 25%, 26.67%)",
  card: "hsl(222, 47.4%, 11.2%)",
  cardForeground: "hsl(0, 0%, 98%)",
  destructive: "hsl(358, 72%, 59%)",
  foreground: "hsl(0, 0%, 98%)",
  muted: "hsl(60, 6%, 17%)",
  mutedForeground: "hsl(212.73, 26.83%, 83.92%)",
  primary: "hsl(236, 61%, 70%)",
  primaryForeground: "hsl(0, 0%, 98%)",
  secondary: "hsl(215.29, 25%, 26.67%)",
};

export const palettes = {
  dark,
  "dark-purple": darkPurple,
  light,
  "light-purple": lightPurple,
} satisfies Record<ResolvedThemeId, ThemeColors>;
