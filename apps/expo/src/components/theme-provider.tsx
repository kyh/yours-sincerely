import { noop } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEME_IDS, THEME_LABELS, isThemeId } from "@repo/contract/preferences";
import type { ResolvedThemeId, ThemeId } from "@repo/contract/preferences";

import { ignoreRejection } from "@/lib/ignore-rejection";

export { isDarkThemeId as isDarkTheme } from "@repo/contract/preferences";

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

export type { ThemeId } from "@repo/contract/preferences";

const THEME_STORAGE_KEY = "theme";

interface ThemeContextValue {
  theme: ThemeId;
  resolvedTheme: ResolvedThemeId;
  isReady: boolean;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isReady: false,
  resolvedTheme: "light",
  setTheme: noop,
  theme: "system",
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreTheme = async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY).catch(() => null);

      if (stored !== null && isThemeId(stored)) {
        setSelectedTheme(stored);
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
