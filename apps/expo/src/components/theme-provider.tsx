import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isThemeId } from "@repo/contracts/preferences";
import type { ResolvedThemeId, ThemeId } from "@repo/contracts/preferences";

import { ignoreRejection } from "@/lib/ignore-rejection";

export { isDarkThemeId as isDarkTheme } from "@repo/contracts/preferences";

interface ThemeOption {
  id: ThemeId;
  label: string;
  color: string;
}

/** Mirrors the web theme list in apps/web/src/components/theme.tsx. */
export const themes: readonly ThemeOption[] = [
  { color: "hsl(45 60% 96%)", id: "system", label: "System" },
  { color: "hsl(45 60% 96%)", id: "light", label: "Light" },
  { color: "hsl(60 6% 5%)", id: "dark", label: "Dark" },
  { color: "hsl(270 100% 90%)", id: "light-purple", label: "Light Purple" },
  { color: "hsl(270 100% 10%)", id: "dark-purple", label: "Dark Purple" },
];

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
      <View className={resolvedTheme === "light" ? "flex-1" : `flex-1 ${resolvedTheme}`}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};
