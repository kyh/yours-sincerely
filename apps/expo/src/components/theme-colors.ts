import { useTheme } from "@/components/theme-provider";
import { palettes } from "@/lib/theme-palette";

export type { ThemeColors } from "@/lib/theme-palette";

export const useThemeColors = () => {
  const { resolvedTheme } = useTheme();

  return palettes[resolvedTheme];
};
