"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KnockFeedProvider,
  NotificationFeedPopover,
} from "@knocklabs/react-notification-feed";
import { useTheme } from "@init/ui/theme";

import { Theme } from "@/lib/core/util/theme";
import { api } from "@/trpc/react";
import { iconAttrs } from "../icon";
import NotificationButton from "../notificationbutton";
import { TopNav } from "../topnav";

const navLinkButtonClassName =
  "relative inline-flex items-center px-2 py-2 border-2 border-slate-200 text-sm font-medium text-slate-500 bg-white transition cursor-pointer outline-offset-[-2px] peer-checked:text-primary-dark peer-checked:bg-primary-bg peer-focus:outline peer-focus:z-10 hover:z-10 hover:border-primary hover:text-primary-dark hover:bg-primary-bg dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:peer-checked:bg-slate-700 dark:peer-checked:text-primary-light dark:hover:text-primary-light dark:hover:border-primary-light";

type NavProps = {
  view?: string;
  setView?: (view: string) => void;
  // ENV?: {
  //   KNOCK_API_KEY?: string,
  //   KNOCK_PUBLIC_API_KEY?: string,
  //   KNOCK_FEED_CHANNEL_ID?: string,
  // }
};

const Navbar = ({ view, setView }: NavProps) => {
  const currentPath = usePathname();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const notifButtonRef = useRef(null);

  const userId = api.auth.me.useQuery().data?.id;

  const handleView = (view: string) => {
    localStorage.setItem("view", view);
    setView && setView(view);
  };

  return (
    currentPath !== "/posts/new" && (
      <TopNav>
        <ul className="flex items-center gap-2">
          {currentPath === "/" && (
            <li className="relative z-0 inline-flex rounded-md shadow-sm">
              <div>
                <input
                  className="peer sr-only"
                  type="radio"
                  value="STACK"
                  name="view"
                  id="stackView"
                  checked={view === "STACK"}
                  onChange={(e) => handleView(e.target.value)}
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
                  value="LIST"
                  name="view"
                  id="listView"
                  checked={view === "LIST"}
                  onChange={(e) => handleView(e.target.value)}
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
          {userId && (
            <li>
              <KnockFeedProvider
                apiKey={"pk_test_RpMgkyvX8aYsgjWTkwXbEKaClijRPPuqsqA7Znao1l8"}
                feedId={"0acb6997-ce91-4e83-aaf6-56d889d61358"}
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
          )}
          <li>
            <Link
              className={`${navLinkButtonClassName} rounded-md shadow-sm`}
              href="/profile"
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
              className="shadow-primary-sm hover:bg-primary-bg hover:text-primary-dark dark:hover:text-primary-light inline-flex items-center rounded-md border-2 border-primary bg-white px-3 py-2 text-primary transition hover:no-underline dark:bg-slate-800"
              href="/posts/new"
            >
              New Post
            </Link>
          </li>
        </ul>
      </TopNav>
    )
  );
};

export default Navbar;
