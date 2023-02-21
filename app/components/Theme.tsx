import { Preferences } from "@capacitor/preferences";
import { useFetcher } from "@remix-run/react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Theme, themes } from "~/lib/core/util/theme";
import { usePlatform } from "~/components/Platform";

type ThemeContextType = {
  theme: Theme | null;
  setTheme: Dispatch<SetStateAction<Theme | null>>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const prefersDarkMQ = "(prefers-color-scheme: dark)";
const getPreferredTheme = () => {
  return window.matchMedia(prefersDarkMQ).matches ? Theme.DARK : Theme.LIGHT;
};

export const ThemeProvider = ({
  children,
  specifiedTheme,
}: {
  children: ReactNode;
  specifiedTheme: Theme | null;
}) => {
  const platform = usePlatform();
  const [theme, setTheme] = useState<Theme | null>(() => {
    // On the server, if we don't have a specified theme then we should
    // return null and the clientThemeCode will set the theme for us
    // before hydration. Then (during hydration), this code will get the same
    // value that clientThemeCode got so hydration is happy.
    if (specifiedTheme) {
      if (themes.includes(specifiedTheme)) {
        return specifiedTheme;
      } else {
        return null;
      }
    }

    // there's no way for us to know what the theme should be in this context
    // the client will have to figure it out before hydration.
    if (typeof document === "undefined") {
      return null;
    }

    return getPreferredTheme();
  });

  const persistTheme = useFetcher();
  // TODO: remove this when persistTheme is memoized properly
  const persistThemeRef = useRef(persistTheme);
  useEffect(() => {
    persistThemeRef.current = persistTheme;
  }, [persistTheme]);

  const mountRun = useRef(false);

  useEffect(() => {
    if (!mountRun.current) {
      mountRun.current = true;
      return;
    }
    if (!theme) return;
    if (!platform.isWeb) Preferences.set({ key: "theme", value: theme });

    persistThemeRef.current.submit(
      { theme },
      { action: "actions/theme", method: "post" }
    );
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(prefersDarkMQ);

    const setThemeFromStorage = async () => {
      const savedTheme = await Preferences.get({ key: "theme" });
      if (savedTheme.value) setTheme(savedTheme.value as Theme);
    };

    const handleChange = () => {
      setTheme(mediaQuery.matches ? Theme.DARK : Theme.LIGHT);
    };

    mediaQuery.addEventListener("change", handleChange);
    if (!platform.isWeb) setThemeFromStorage();

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [platform]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

const clientThemeCode = `
;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersDarkMQ)}).matches
    ? 'dark'
    : 'light';
  const cl = document.documentElement.classList;
  const themeAlreadyApplied = cl.contains('light') || cl.contains('dark');
  if (!themeAlreadyApplied) {
    cl.add(theme);
  }
  const meta = document.querySelector('meta[name=color-scheme]');
  if (meta) {
    if (theme === 'dark') {
      meta.content = 'dark light';
    } else if (theme === 'light') {
      meta.content = 'light dark';
    }
  }
})();
`;

const themeStylesCode = `
  /* default light, but app-preference is "dark" */
  html.dark light-mode {
    display: none;
  }
  /* default light, and no app-preference */
  html:not(.dark) dark-mode {
    display: none;
  }
  @media (prefers-color-scheme: dark) {
    /* prefers dark, but app-preference is "light" */
    html.light dark-mode {
      display: none;
    }
    /* prefers dark, and app-preference is "dark" */
    html.dark light-mode,
    /* prefers dark and no app-preference */
    html:not(.light) light-mode {
      display: none;
    }
  }
`;

export const ThemeHead = ({ ssrTheme }: { ssrTheme: boolean }) => {
  const { theme } = useTheme();

  return (
    <>
      <meta
        name="color-scheme"
        content={theme === "light" ? "light dark" : "dark light"}
      />
      {ssrTheme ? null : (
        <>
          <script dangerouslySetInnerHTML={{ __html: clientThemeCode }} />
          <style dangerouslySetInnerHTML={{ __html: themeStylesCode }} />
        </>
      )}
    </>
  );
};

const clientDarkAndLightModeElsCode = `;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersDarkMQ)}).matches
    ? 'dark'
    : 'light';
  const darkEls = document.querySelectorAll("dark-mode");
  const lightEls = document.querySelectorAll("light-mode");
  for (const darkEl of darkEls) {
    if (theme === "dark") {
      for (const child of darkEl.childNodes) {
        darkEl.parentElement?.append(child);
      }
    }
    darkEl.remove();
  }
  for (const lightEl of lightEls) {
    if (theme === "light") {
      for (const child of lightEl.childNodes) {
        lightEl.parentElement?.append(child);
      }
    }
    lightEl.remove();
  }
})();`;

export const ThemeBody = ({ ssrTheme }: { ssrTheme: boolean }) => {
  return ssrTheme ? null : (
    <script
      dangerouslySetInnerHTML={{ __html: clientDarkAndLightModeElsCode }}
    />
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/**
 * This allows you to render something that depends on the theme without
 * worrying about whether it'll SSR properly when we don't actually know
 * the user's preferred theme.
 */
export const Themed = ({
  dark,
  light,
  initialOnly = false,
}: {
  dark: ReactNode | string;
  light: ReactNode | string;
  initialOnly?: boolean;
}) => {
  const { theme } = useTheme();
  const [initialTheme] = useState(theme);
  const themeToReference = initialOnly ? initialTheme : theme;
  const serverRenderWithUnknownTheme =
    !theme && typeof document === "undefined";

  if (serverRenderWithUnknownTheme) {
    // stick them both in and our little script will update the DOM to match
    // what we'll render in the client during hydration.
    return (
      <>
        {createElement("dark-mode", null, dark)}
        {createElement("light-mode", null, light)}
      </>
    );
  }

  return <>{themeToReference === "light" ? light : dark}</>;
};

const fontStylesCode = `
@font-face {
  font-family: "HelveticaNow";
  src: url(/fonts/subset-HelveticaNowText-BoldIt.woff2) format("woff2"),
    url(/fonts/subset-HelveticaNowText-BoldIt.woff) format("woff");
  font-weight: 700;
  font-style: italic;
  font-display: fallback;
}

@font-face {
  font-family: "HelveticaNow";
  src: url(/fonts/subset-HelveticaNowText-It.woff2) format("woff2"),
    url(/fonts/subset-HelveticaNowText-It.woff) format("woff");
  font-weight: 400;
  font-style: italic;
  font-display: fallback;
}

@font-face {
  font-family: "HelveticaNow";
  src: url(/fonts/subset-HelveticaNowText-Regular.woff2) format("woff2"),
    url(/fonts/subset-HelveticaNowText-Regular.woff) format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: fallback;
}

@font-face {
  font-family: "HelveticaNow";
  src: url(/fonts/subset-HelveticaNowDisplay-Black.woff2) format("woff2"),
    url(/fonts/subset-HelveticaNowDisplay-Black.woff) format("woff");
  font-weight: 900;
  font-style: normal;
  font-display: fallback;
}

@font-face {
  font-family: "HelveticaNow";
  src: url(/fonts/subset-HelveticaNowText-Bold.woff2) format("woff2"),
    url(/fonts/subset-HelveticaNowText-Bold.woff) format("woff");
  font-weight: 700;
  font-style: normal;
  font-display: fallback;
}
`;

export const FontStyles = () => {
  return <style dangerouslySetInnerHTML={{ __html: fontStylesCode }} />;
};
