import { useState, useEffect } from "react";
import { json, LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import { ClientOnly } from "remix-utils";
import { getFlash } from "~/lib/core/server/session.server";
import { Theme, ThemeProvider, useTheme } from "~/lib/core/ui/Theme";
import { PlatformProvider } from "~/lib/core/ui/Platform";
import { ToastProvider, useToast } from "~/lib/core/ui/Toaster";
import { TopNav } from "~/lib/core/ui/TopNav";
import { iconAttrs } from "~/lib/core/ui/Icon";

const viewKey = "postsView";

type LoaderData = {
  message?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const { message, headers } = await getFlash(request);

  const data: LoaderData = {
    message,
  };

  return json(data, { headers });
};

const Page = () => {
  const matches = useMatches();
  const [view, setView] = useState("stack");
  const { pathname: currentPath } = matches[matches.length - 1];

  useEffect(() => {
    // TODO: move this into session storage instead of local
    const savedView = localStorage.getItem(viewKey);
    if (savedView) setView(savedView);
  }, []);

  const handleSetView = (view: string) => {
    localStorage.setItem(viewKey, view);
    setView(view);
  };

  return (
    <PlatformProvider>
      <ThemeProvider>
        <ToastProvider>
          <section
            className={`page ${
              currentPath === "/posts/new" ? "bg-white dark:bg-slate-800" : ""
            }`}
          >
            {currentPath !== "/posts/new" && (
              <Nav
                currentPath={currentPath}
                view={view}
                setView={handleSetView}
              />
            )}
            <Outlet context={{ view }} />
            {currentPath !== "/posts/new" && <Footer />}
          </section>
        </ToastProvider>
      </ThemeProvider>
    </PlatformProvider>
  );
};

const navLinkButtonClassName =
  "relative inline-flex items-center px-2 py-2 border-2 border-slate-200 text-sm font-medium text-slate-500 bg-white transition cursor-pointer peer-checked:text-primary-dark peer-checked:bg-primary-bg peer-focus:outline hover:z-10 hover:border-primary hover:text-primary-dark hover:bg-primary-bg dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:peer-checked:bg-slate-700 dark:peer-checked:text-primary-light dark:hover:text-primary-light dark:hover:border-primary-light";

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
          <li className="relative z-0 inline-flex shadow-sm rounded-md">
            <div>
              <input
                className="sr-only peer"
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
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </label>
            </div>
            <div>
              <input
                className="sr-only peer"
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
            <svg {...iconAttrs} strokeWidth="3">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </li>
        <li>
          <Link
            className="inline-flex items-center px-3 py-2 transition bg-white border-2 rounded-md border-primary shadow-primary-sm text-primary hover:text-primary-dark hover:bg-primary-bg hover:no-underline dark:bg-slate-800 dark:hover:text-primary-light"
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
  const { message } = useLoaderData<LoaderData>();

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
          <ClientOnly
            fallback={
              <div className="px-2 py-1 text-xs text-center rounded border border-slate-500 dark:border-slate-100">
                Default
              </div>
            }
          >
            {() => (
              <select
                className="px-2 py-1 text-xs text-center bg-transparent rounded border-slate-500 bg-none focus:border-primary-dark dark:border-slate-100 dark:focus:border-primary-light"
                value={theme || "default"}
                onChange={onThemeChange}
              >
                <option value="default">Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            )}
          </ClientOnly>
        </li>
      </ul>
    </footer>
  );
};

export default Page;
