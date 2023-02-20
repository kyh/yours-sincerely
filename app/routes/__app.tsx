import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { useState, useEffect } from "react";
import {
  Link,
  Outlet,
  useMatches,
  useOutletContext,
  useFetcher,
} from "@remix-run/react";
import { useTheme } from "~/lib/core/ui/Theme";
import { ToastProvider, useToast } from "~/lib/core/ui/Toaster";
import { TopNav } from "~/lib/core/ui/TopNav";
import { iconAttrs } from "~/lib/core/ui/Icon";
import type { Theme } from "~/lib/core/util/theme";
import { themes } from "~/lib/core/util/theme";
import { usePlatform } from "~/lib/core/ui/Platform";

const Page = () => {
  const { postView } = useOutletContext<{ postView: string }>();
  const platform = usePlatform();
  const matches = useMatches();
  const [view, setView] = useState(postView);
  const persistView = useFetcher();

  const { pathname: currentPath } = matches[matches.length - 1];

  const handleSetView = (view: string) => {
    if (!platform.isWeb) Preferences.set({ key: "postView", value: view });
    persistView.submit(
      { view },
      { action: "actions/post-view", method: "post" }
    );
    setView(view);
  };

  useEffect(() => {
    const setViewFromStorage = async () => {
      const view = await Preferences.get({ key: "postView" });
      if (view.value) setView(view.value);
    };
    if (!platform.isWeb) setViewFromStorage();
  }, [platform]);

  useEffect(() => {
    App.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
  }, []);

  return (
    <ToastProvider>
      <section
        className={`page ${
          currentPath === "/posts/new" ? "bg-white dark:bg-slate-800" : ""
        }`}
      >
        {currentPath !== "/posts/new" && (
          <Nav currentPath={currentPath} view={view} setView={handleSetView} />
        )}
        <Outlet context={{ view }} />
        {currentPath !== "/posts/new" && <Footer />}
      </section>
    </ToastProvider>
  );
};

const navLinkButtonClassName =
  "relative inline-flex items-center px-2 py-2 border-2 border-slate-200 text-sm font-medium text-slate-500 bg-white transition cursor-pointer outline-offset-[-2px] peer-checked:text-primary-dark peer-checked:bg-primary-bg peer-focus:outline peer-focus:z-10 hover:z-10 hover:border-primary hover:text-primary-dark hover:bg-primary-bg dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:peer-checked:bg-slate-700 dark:peer-checked:text-primary-light dark:hover:text-primary-light dark:hover:border-primary-light";

const Nav = ({
  currentPath,
  view,
  setView,
}: {
  currentPath: string;
  view: string;
  setView: (view: string) => void;
}) => {
  return (
    <TopNav>
      <ul className="flex items-center gap-3">
        {currentPath === "/" && (
          <li className="relative z-0 inline-flex rounded-md shadow-sm">
            <div>
              <input
                className="peer sr-only"
                type="radio"
                value="stack"
                name="view"
                id="stackView"
                checked={view === "stack"}
                onChange={(e) => setView(e.target.value)}
              />
              <label
                className={`${navLinkButtonClassName} rounded-l-md`}
                htmlFor="stackView"
              >
                <span className="sr-only">Stack View</span>
                <svg {...iconAttrs}>
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </label>
            </div>
            <div>
              <input
                className="peer sr-only"
                type="radio"
                value="list"
                name="view"
                id="listView"
                checked={view === "list"}
                onChange={(e) => setView(e.target.value)}
              />
              <label
                className={`${navLinkButtonClassName} -ml-px rounded-r-md`}
                htmlFor="listView"
              >
                <span className="sr-only">List View</span>
                <svg {...iconAttrs} strokeWidth="3">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </label>
            </div>
          </li>
        )}
        <li>
          <Link
            className={`${navLinkButtonClassName} rounded-md shadow-sm`}
            to="/profile"
          >
            <span className="sr-only">Go to profile</span>
            <svg {...iconAttrs} strokeWidth="3">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </li>
        <li>
          <Link
            className="inline-flex items-center rounded-md border-2 border-primary bg-white px-3 py-2 text-primary shadow-primary-sm transition hover:bg-primary-bg hover:text-primary-dark hover:no-underline dark:bg-slate-800 dark:hover:text-primary-light"
            to="/posts/new"
          >
            New Post
          </Link>
        </li>
      </ul>
    </TopNav>
  );
};

const Footer = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { message } = useOutletContext<{ message: string }>();

  useEffect(() => {
    if (message) toast(message);
  }, [message]);

  const onThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const updated =
      event.target.value === "default" ? null : event.target.value;
    setTheme(updated as Theme);
  };

  return (
    <footer className="flex items-center justify-between py-5 text-sm leading-4 text-slate-500 dark:text-slate-100">
      <span>©{new Date().getFullYear()}, Made with 💻</span>
      <ul className="flex items-center gap-3">
        <li>
          <Link className="text-slate-500 dark:text-slate-100" to="/about">
            About
          </Link>
        </li>
        <li>
          <a
            className="text-slate-500 dark:text-slate-100"
            href="https://github.com/kyh/yours-sincerely"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </li>
        <li>
          <select
            className="rounded border-slate-500 bg-transparent bg-none px-2 py-1 text-center text-xs capitalize focus:border-primary-dark dark:border-slate-100 dark:focus:border-primary-light"
            value={theme || "default"}
            onChange={onThemeChange}
          >
            {themes.map((theme) => (
              <option value={theme} key={theme}>
                {theme}
              </option>
            ))}
          </select>
        </li>
      </ul>
    </footer>
  );
};

export default Page;
