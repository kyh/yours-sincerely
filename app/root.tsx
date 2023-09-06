import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import NProgress from "nprogress";
import { useEffect, useMemo } from "react";
import { PlatformProvider, usePlatform } from "~/components/Platform";
import {
  FontStyles,
  ThemeBody,
  ThemeHead,
  ThemeProvider,
} from "~/components/Theme";
import { getUserId } from "~/lib/auth/server/authenticator.server";
import {
  getFlash,
  getPostView,
  getTheme,
} from "~/lib/core/server/session.server";
import { createMeta } from "~/lib/core/util/meta";
import knockStyles from "@knocklabs/react-notification-feed/dist/index.css";
import styles from "./global.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: knockStyles },
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
  { rel: "manifest", href: "/site.webmanifest" },
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
  const userId = await getUserId(request);
  const theme = await getTheme(request);
  const postView = await getPostView(request);
  const { message, headers } = await getFlash(request);

  return json(
    {
      userId,
      theme,
      postView,
      message,
      ENV: {
        KNOCK_PUBLIC_API_KEY: process.env.KNOCK_PUBLIC_API_KEY,
        KNOCK_FEED_CHANNEL_ID: process.env.KNOCK_FEED_CHANNEL_ID,
      },
    },
    { headers }
  );
};

const App = () => {
  const { platform } = usePlatform();
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const fetchers = useFetchers();

  const state = useMemo<"idle" | "loading">(() => {
    let states = [
      navigation.state,
      ...fetchers.map((fetcher) => fetcher.state),
    ];
    if (states.every((state) => state === "idle")) return "idle";
    return "loading";
  }, [navigation.state, fetchers]);

  useEffect(() => {
    if (state === "loading") NProgress.start();
    if (state === "idle") NProgress.done();
  }, [state]);

  useEffect(() => {
    SplashScreen.hide();

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });
  }, []);

  return (
    <html lang="en" className={`${data.theme ?? ""} ${platform}`}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <Meta />
        <Links />
        <ThemeHead ssrTheme={Boolean(data.theme)} />
        <FontStyles />
      </head>
      <body>
        <Outlet context={data} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
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
  const data = useLoaderData<typeof loader>();
  return (
    <PlatformProvider>
      <ThemeProvider specifiedTheme={data.theme}>
        <App />
      </ThemeProvider>
    </PlatformProvider>
  );
}

declare global {
  interface Window {
    ENV: Record<string, string>;
  }
}
