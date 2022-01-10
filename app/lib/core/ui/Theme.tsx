import React, { createContext, useContext, useEffect, useState } from "react";

export const themeKey = "theme";

export type Theme = "default" | "light" | "dark";

export const isDark = (rawTheme: Theme) => {
  return (
    rawTheme === "dark" ||
    (rawTheme === "default" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
};

export const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined" && window.localStorage) {
    const storedPrefs = window.localStorage.getItem(themeKey);

    if (typeof storedPrefs === "string") {
      return storedPrefs as Theme;
    }

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  return "default";
};

export const setDocumentTheme = (rawTheme: Theme) => {
  if (isDark(rawTheme)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  if (rawTheme) {
    localStorage.setItem(themeKey, rawTheme);
  }
};

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  isDarkMode: boolean;
}>({
  theme: "light",
  setTheme: () => {},
  isDarkMode: false,
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDarkMode = isDark(theme);

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
