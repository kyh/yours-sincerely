import { Preferences } from "@capacitor/preferences";
import {
  KnockFeedProvider,
  NotificationFeedPopover,
  useKnockFeed,
} from "@knocklabs/react-notification-feed";
import {
  Link,
  Outlet,
  useFetcher,
  useMatches,
  useOutletContext,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils";
import { iconAttrs } from "~/components/Icon";
import { usePlatform } from "~/components/Platform";
import { useTheme } from "~/components/Theme";
import { ToastProvider, useToast } from "~/components/Toaster";
import { TopNav } from "~/components/TopNav";
import { Theme, themes } from "~/lib/core/util/theme";

type OutletContext = {
  userId?: string;
  postView: string;
  ENV: Record<string, string>;
};

const Page = () => {
  const data = useOutletContext<OutletContext>();
  const platform = usePlatform();
  const matches = useMatches();
  const [view, setView] = useState(data.postView);
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

  return (
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
            {...data}
          />
        )}
        <Outlet context={{ view }} />
        {currentPath !== "/posts/new" && <Footer />}
      </section>
    </ToastProvider>
  );
};

const navLinkButtonClassName =
  "relative inline-flex items-center px-2 py-2 border-2 border-slate-200 text-sm font-medium text-slate-500 bg-white transition cursor-pointer outline-offset-[-2px] peer-checked:text-primary-dark peer-checked:bg-primary-bg peer-focus:outline peer-focus:z-10 hover:z-10 hover:border-primary hover:text-primary-dark hover:bg-primary-bg dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:peer-checked:bg-slate-700 dark:peer-checked:text-primary-light dark:hover:text-primary-light dark:hover:border-primary-light";

type NavProps = OutletContext & {
  currentPath: string;
  view: string;
  setView: (view: string) => void;
};

const Nav = ({ userId, ENV, currentPath, view, setView }: NavProps) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const notifButtonRef = useRef(null);

  return (
    <TopNav>
      <ul className="flex items-center gap-2">
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
        <ClientOnly>
          {() =>
            userId && (
              <li>
                <KnockFeedProvider
                  apiKey={ENV.KNOCK_PUBLIC_API_KEY}
                  feedId={ENV.KNOCK_FEED_CHANNEL_ID}
                  userId={userId}
                  colorMode={theme === Theme.LIGHT ? "light" : "dark"}
                >
                  <>
                    <NotificationButton
                      notifButtonRef={notifButtonRef}
                      setIsVisible={setIsVisible}
                      isVisible={isVisible}
                    />
                    <NotificationFeedPopover
                      buttonRef={notifButtonRef}
                      isVisible={isVisible}
                      onClose={() => setIsVisible(false)}
                    />
                  </>
                </KnockFeedProvider>
              </li>
            )
          }
        </ClientOnly>
        <li>
          <Link
            className={`${navLinkButtonClassName} rounded-md shadow-sm`}
            to="/profile"
          >
            <span className="sr-only">Go to profile</span>
            <svg {...iconAttrs} strokeWidth="2.5">
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

type NotificationButtonProps = {
  notifButtonRef: React.RefObject<HTMLButtonElement>;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isVisible: boolean;
};

const NotificationButton = ({
  notifButtonRef,
  setIsVisible,
  isVisible,
}: NotificationButtonProps) => {
  const { useFeedStore } = useKnockFeed();
  const items = useFeedStore((state) => state.items);

  const hasUnread = items.some((item) => !item.read_at);
  console.log("hasUnread", hasUnread);
  return (
    <button
      className={`${navLinkButtonClassName} rounded-md shadow-sm`}
      ref={notifButtonRef}
      onClick={() => setIsVisible(!isVisible)}
    >
      {hasUnread && (
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
      )}
      <span className="sr-only">Open notifications</span>
      <svg {...iconAttrs} strokeWidth="2.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
    </button>
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
