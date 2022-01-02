import React, { createContext, useContext, useEffect, useState } from "react";

export const themeKey = "theme";

export type Theme = "default" | "light" | "dark";

const getInitialTheme = (): Theme => {
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

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}>({
  theme: "light",
  setTheme: () => {},
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  const rawSetTheme = (rawTheme: Theme) => {
    if (
      rawTheme === "dark" ||
      (rawTheme === "default" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (rawTheme) {
      localStorage.setItem(themeKey, rawTheme);
    }
  };

  useEffect(() => {
    rawSetTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
