import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@init/ui/theme";
import { Toaster } from "@init/ui/toast";
import { cn } from "@init/ui/utils";

import { TRPCReactProvider } from "@/trpc/react";

import "./globals.css";
import "@knocklabs/react-notification-feed/dist/index.css";

import Link from "next/link";
import { Button } from "@init/ui/button";
import { Logo } from "@init/ui/logo";
import {
  BellIcon,
  BookmarkIcon,
  Component1Icon,
  HomeIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_ENV === "production"
      ? "https://init.kyh.io"
      : "http://localhost:3000",
  ),
  title: {
    template: "%s - Init",
    default: "Init",
  },
  description:
    "A comprehensive boilerplate to build, launch, and scale your next project",
  openGraph: {
    title: "Init",
    description:
      "A comprehensive boilerplate to build, launch, and scale your next project",
    url: "https://github.com/kyh/init",
    siteName: "Init",
  },
  twitter: {
    card: "summary_large_image",
    site: "@kaiyuhsu",
    creator: "@kaiyuhsu",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background font-sans text-foreground antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCReactProvider>
            <section className="page-layout mx-auto min-h-dvh max-w-3xl px-5 lg:max-w-screen-xl">
              <MainHeader />
              <Sidebar />
              {children}
              <AsideHeader />
            </section>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default Layout;

const MainHeader = () => (
  <div className="area-nav-header hidden items-center border-b border-b-border lg:flex">
    <Link href="/">
      <Logo />
    </Link>
  </div>
);

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon, current: true },
  { name: "Explore", href: "/explore", icon: Component1Icon, current: false },
  { name: "Bookmark", href: "/bookmark", icon: BookmarkIcon, current: false },
];

const footerNavigation = [
  { name: "About", href: "/about" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

const Sidebar = () => {
  return (
    <section className="area-nav hidden flex-col lg:flex">
      <nav className="flex flex-col py-6">
        {navigation.map((item) => (
          <Link
            className="flex items-center gap-2"
            href={item.href}
            key={item.name}
          >
            <item.icon aria-hidden="true" className="h-5 w-5" />
            <span className="truncate">{item.name}</span>
          </Link>
        ))}
      </nav>
      <footer className="mt-auto flex flex-col gap-2 border-t border-t-border py-4 text-xs">
        <div>
          ©{new Date().getFullYear()}, Made with{" "}
          <a
            className="hover:underline"
            href="https://github.com/kyh/yours-sincerely"
            target="_blank"
            rel="noreferrer"
          >
            💻
          </a>
        </div>
        <div className="flex gap-2">
          {footerNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="inline-block hover:underline"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </footer>
    </section>
  );
};

const AsideHeader = () => (
  <div className="area-aside-header hidden items-center justify-end space-x-4 border-b border-b-border xl:flex">
    <Button variant="ghost">
      <span className="sr-only">Search</span>
      <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
    </Button>
    <Button variant="ghost">
      <span className="sr-only">View notifications</span>
      <BellIcon className="h-6 w-6" aria-hidden="true" />
    </Button>
  </div>
);
