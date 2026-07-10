import { useTheme, type ThemeId } from "@/components/theme-provider";

/** Raw palette values for props NativeWind classes can't reach
    (placeholderTextColor, SVG fills, navigation themes, spinners).
    Values mirror src/styles.css — keep in sync. */
type ThemeColors = {
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
};

const light: ThemeColors = {
  background: "hsl(45, 60%, 96%)",
  foreground: "hsl(60, 6%, 13%)",
  card: "hsl(34, 10%, 98%)",
  cardForeground: "hsl(60, 6%, 13%)",
  primary: "hsl(60, 6%, 13%)",
  primaryForeground: "hsl(34, 10%, 98%)",
  secondary: "hsl(47, 27%, 87%)",
  muted: "hsl(47, 27%, 87%)",
  mutedForeground: "hsl(60, 6%, 60%)",
  accent: "hsl(47, 27%, 87%)",
  destructive: "hsl(358, 72%, 59%)",
  border: "hsl(60, 6%, 85%)",
};

const dark: ThemeColors = {
  background: "hsl(60, 6%, 5%)",
  foreground: "hsl(0, 0%, 98%)",
  card: "hsl(0, 0%, 10%)",
  cardForeground: "hsl(0, 0%, 98%)",
  primary: "hsl(0, 0%, 98%)",
  primaryForeground: "hsl(0, 0%, 10%)",
  secondary: "hsl(60, 6%, 17%)",
  muted: "hsl(60, 6%, 17%)",
  mutedForeground: "hsl(60, 6%, 50%)",
  accent: "hsl(60, 6%, 17%)",
  destructive: "hsl(0, 62.8%, 30.6%)",
  border: "hsl(60, 6%, 17%)",
};

const lightPurple: ThemeColors = {
  background: "hsl(256, 40%, 95%)",
  foreground: "hsl(258, 78%, 14%)",
  card: "hsl(34, 10%, 98%)",
  cardForeground: "hsl(258, 78%, 14%)",
  primary: "hsl(236, 61%, 70%)",
  primaryForeground: "hsl(34, 10%, 98%)",
  secondary: "hsl(260, 19%, 76%)",
  muted: "hsl(260, 19%, 76%)",
  mutedForeground: "hsl(258, 16%, 58%)",
  accent: "hsl(260, 19%, 90%)",
  destructive: "hsl(358, 72%, 59%)",
  border: "hsl(258, 22%, 76%)",
};

const darkPurple: ThemeColors = {
  background: "hsl(217, 33%, 17%)",
  foreground: "hsl(0, 0%, 98%)",
  card: "hsl(222, 47%, 11%)",
  cardForeground: "hsl(0, 0%, 98%)",
  primary: "hsl(236, 61%, 70%)",
  primaryForeground: "hsl(0, 0%, 98%)",
  secondary: "hsl(215, 25%, 27%)",
  muted: "hsl(60, 6%, 17%)",
  mutedForeground: "hsl(213, 27%, 84%)",
  accent: "hsl(215, 25%, 27%)",
  destructive: "hsl(358, 72%, 59%)",
  border: "hsl(215, 25%, 27%)",
};

const palettes: Record<Exclude<ThemeId, "system">, ThemeColors> = {
  light,
  dark,
  "light-purple": lightPurple,
  "dark-purple": darkPurple,
};

export const useThemeColors = (): ThemeColors => {
  const { resolvedTheme } = useTheme();
  return palettes[resolvedTheme];
};
