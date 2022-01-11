import { createContext, useContext, useEffect, useState } from "react";

export type Theme = null | "light" | "dark";

const themeKey = "theme";

const themeScript = `
if (
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}
`;

export const isDark = (rawTheme: Theme) => {
  return (
    rawTheme === "dark" ||
    (!rawTheme &&
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
  }

  return null;
};

export const setDocumentTheme = (rawTheme: Theme) => {
  if (isDark(rawTheme)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  if (rawTheme) {
    localStorage.setItem(themeKey, rawTheme);
  } else {
    localStorage.removeItem(themeKey);
  }
};

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  isDarkMode: boolean;
}>({
  theme: null,
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
      <script
        dangerouslySetInnerHTML={{
          __html: themeScript,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
};
