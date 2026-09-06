import { useTheme } from "@/components/theme-provider";
import { palettes, type ThemeColors } from "@/lib/theme-palette";

export type { ThemeColors } from "@/lib/theme-palette";

export const useThemeColors = (): ThemeColors => {
  const { resolvedTheme } = useTheme();
  return palettes[resolvedTheme];
};
