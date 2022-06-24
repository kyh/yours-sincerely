import { useEffect, useMemo } from "react";
import { LinksFunction, MetaFunction } from "@remix-run/node";
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

export async function loader() {
  return {
    ENV: {
      POSTHOG_API_TOKEN: process.env.POSTHOG_API_TOKEN,
    },
  };
}

export default function App() {
  const data = useLoaderData();
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
    if (process.env.NODE_ENV === "production") {
      posthog.init(data.ENV.POSTHOG_API_TOKEN, {
        api_host: "https://app.posthog.com",
      });
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
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
}
