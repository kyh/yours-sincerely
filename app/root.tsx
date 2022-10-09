import { useEffect, useMemo } from "react";
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
import posthog from "posthog-js";
import {
  getTheme,
  getFlash,
  getPostView,
} from "~/lib/core/server/session.server";
import { ThemeBody, ThemeHead, ThemeProvider } from "~/lib/core/ui/Theme";
import { PlatformProvider } from "~/lib/core/ui/Platform";
import { createMeta } from "~/lib/core/util/meta";

import styles from "./tailwind.css";

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

  return json(
    {
      message,
      theme,
      postView,
      ENV: {
        POSTHOG_API_TOKEN: process.env.POSTHOG_API_TOKEN,
      },
    },
    { headers }
  );
};

const App = () => {
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

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && data.ENV.POSTHOG_API_TOKEN) {
      posthog.init(data.ENV.POSTHOG_API_TOKEN, {
        api_host: "https://app.posthog.com",
      });
    }
  }, []);

  return (
    <html lang="en" className={data.theme ?? ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <ThemeHead ssrTheme={Boolean(data.theme)} />
      </head>
      <body>
        <Outlet context={data} />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
        <ThemeBody ssrTheme={Boolean(data.theme)} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
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
