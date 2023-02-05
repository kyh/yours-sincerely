import { useLocation, useMatches } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import type { LinksFunction, MetaFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useTransition,
  useFetchers,
} from "@remix-run/react";
import NProgress from "nprogress";
import {
  getTheme,
  getFlash,
  getPostView,
} from "~/lib/core/server/session.server";
import { ThemeBody, ThemeHead, ThemeProvider } from "~/lib/core/ui/Theme";
import { PlatformProvider } from "~/lib/core/ui/Platform";
import { createMeta } from "~/lib/core/util/meta";
import { SafeArea } from "capacitor-plugin-safe-area";
import styles from "./tailwind.css";

let isMount = true;

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/favicon/apple-touch-icon.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon/favicon-16x16.png",
  },
  { rel: "manifest", href: "/favicon/site.webmanifest" },
  {
    rel: "mask-icon",
    href: "/favicon/safari-pinned-tab.svg",
    color: "#111827",
  },
  { rel: "shortcut icon", href: "/favicon/favicon.ico" },
];

export const meta: MetaFunction = () => {
  return createMeta();
};

export const loader = async ({ request }: LoaderArgs) => {
  const theme = await getTheme(request);
  const postView = await getPostView(request);
  const { message, headers } = await getFlash(request);

  return json({ message, theme, postView }, { headers });
};

const App = () => {
  const [inset, setInset] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const data = useLoaderData<typeof loader>();
  const transition = useTransition();
  const fetchers = useFetchers();

  const state = useMemo<"idle" | "loading">(() => {
    let states = [
      transition.state,
      ...fetchers.map((fetcher) => fetcher.state),
    ];
    if (states.every((state) => state === "idle")) return "idle";
    return "loading";
  }, [transition.state, fetchers]);

  useEffect(() => {
    if (state === "loading") NProgress.start();
    if (state === "idle") NProgress.done();
  }, [transition.state]);

  const location = useLocation();
  const matches = useMatches();

  useEffect(() => {
    const mounted = isMount;
    isMount = false;
    if ("serviceWorker" in navigator) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "REMIX_NAVIGATION",
          isMount: mounted,
          location,
          matches,
          manifest: window.__remixManifest,
        });
      } else {
        const listener = async () => {
          await navigator.serviceWorker.ready;
          navigator.serviceWorker.controller?.postMessage({
            type: "REMIX_NAVIGATION",
            isMount: mounted,
            location,
            matches,
            manifest: window.__remixManifest,
          });
        };

        navigator.serviceWorker.addEventListener("controllerchange", listener);

        return () => {
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            listener
          );
        };
      }
    }

    SafeArea.getSafeAreaInsets().then(({ insets }) => setInset(insets));
  }, [location]);

  return (
    <html lang="en" className={data.theme ?? ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="manifest" href="/site.webmanifest" />
        <Meta />
        <Links />
        <ThemeHead ssrTheme={Boolean(data.theme)} />
      </head>
      <body
        style={{
          paddingTop: inset.top,
          paddingBottom: inset.bottom,
          paddingLeft: inset.left,
          paddingRight: inset.right,
        }}
      >
        <Outlet context={data} />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
        <ThemeBody ssrTheme={Boolean(data.theme)} />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "8740427a7d694e29b8cbc2842904d89b"}'
        />
      </body>
    </html>
  );
};

export default function AppWithProviders() {
  const { theme } = useLoaderData<typeof loader>();
  return (
    <PlatformProvider>
      <ThemeProvider specifiedTheme={theme}>
        <App />
      </ThemeProvider>
    </PlatformProvider>
  );
}
