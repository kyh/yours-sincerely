import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isDarkThemeId,
  isThemeId,
  type ResolvedThemeId,
  type ThemeId,
} from "@repo/contracts/preferences";

type ThemeOption = { id: ThemeId; label: string; color: string };

/** Mirrors the web theme list in apps/web/src/components/theme.tsx. */
export const themes: readonly ThemeOption[] = [
  { id: "system", label: "System", color: "hsl(45 60% 96%)" },
  { id: "light", label: "Light", color: "hsl(45 60% 96%)" },
  { id: "dark", label: "Dark", color: "hsl(60 6% 5%)" },
  { id: "light-purple", label: "Light Purple", color: "hsl(270 100% 90%)" },
  { id: "dark-purple", label: "Dark Purple", color: "hsl(270 100% 10%)" },
];

export type { ThemeId } from "@repo/contracts/preferences";

export const isDarkTheme = isDarkThemeId;

const THEME_STORAGE_KEY = "theme";

type ThemeContextValue = {
  /** The user's selected theme (may be "system"). */
  theme: ThemeId;
  /** The concrete theme in effect ("system" resolved via OS color scheme). */
  resolvedTheme: ResolvedThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => undefined,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeId>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored !== null && isThemeId(stored)) setThemeState(stored);
      return undefined;
    });
  }, []);

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  };

  const resolvedTheme = theme === "system" ? (colorScheme === "dark" ? "dark" : "light") : theme;

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View className={resolvedTheme === "light" ? "flex-1" : `flex-1 ${resolvedTheme}`}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};
