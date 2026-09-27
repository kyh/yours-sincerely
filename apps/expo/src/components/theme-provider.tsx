import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEME_IDS, THEME_LABELS, isThemeId } from "@repo/contracts/preferences";
import type { ResolvedThemeId, ThemeId } from "@repo/contracts/preferences";

import { ignoreRejection } from "@/lib/ignore-rejection";

export { isDarkThemeId as isDarkTheme } from "@repo/contracts/preferences";

const themeColors = {
  dark: "hsl(60 6% 5%)",
  "dark-purple": "hsl(270 100% 10%)",
  light: "hsl(45 60% 96%)",
  "light-purple": "hsl(270 100% 90%)",
  system: "hsl(45 60% 96%)",
} satisfies Record<ThemeId, string>;

export const themes = THEME_IDS.map((id) => ({
  color: themeColors[id],
  id,
  label: THEME_LABELS[id],
}));

export type { ThemeId } from "@repo/contracts/preferences";

const THEME_STORAGE_KEY = "theme";

interface ThemeContextValue {
  /** The user's selected theme (may be "system"). */
  theme: ThemeId;
  /** The concrete theme in effect ("system" resolved via OS color scheme). */
  resolvedTheme: ResolvedThemeId;
  /** False until the stored choice has been read, so the splash screen can
      stay up instead of flashing the default theme first. */
  isReady: boolean;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isReady: false,
  resolvedTheme: "light",
  setTheme: () => {
    // Without a provider there is nothing to store the choice in.
  },
  theme: "system",
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== null && isThemeId(stored)) {
          setSelectedTheme(stored);
        }
      } catch {
        // Unreadable storage keeps the default theme.
      }
      setIsReady(true);
    };
    void restoreTheme();
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setSelectedTheme(next);
    void ignoreRejection(AsyncStorage.setItem(THEME_STORAGE_KEY, next));
  }, []);

  const systemTheme = colorScheme === "dark" ? "dark" : "light";
  const resolvedTheme = selectedTheme === "system" ? systemTheme : selectedTheme;

  const value = useMemo(
    () => ({ isReady, resolvedTheme, setTheme, theme: selectedTheme }),
    [selectedTheme, resolvedTheme, isReady, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View
        accessible={false}
        focusable={false}
        // Keep wrappers and inherited base tokens present before navigation mounts.
        className={
          resolvedTheme === "light"
            ? "will-change-variable will-change-container flex-1 light"
            : `will-change-variable will-change-container flex-1 light ${resolvedTheme}`
        }
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
};
