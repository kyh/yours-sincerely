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

import type { User } from "@supabase/auth-helpers-nextjs";
import { HomeIcon } from "@/components/icons/home-icon";
import { NotificationIcon } from "@/components/icons/notification-icon";
import { ProfileIcon } from "@/components/icons/profile-icon";
import { SearchIcon } from "@/components/icons/search-icon";
import { api } from "@/trpc/server";

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

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await api.auth.me();

  console.log("user", user);

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
              <Sidebar user={user} />
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
  <div className="area-nav-header flex items-center border-b border-b-border">
    <Link href="/">
      <Logo />
    </Link>
  </div>
);

const Sidebar = ({ user }: { user: User | null }) => {
  return (
    <section className="area-nav flex flex-col">
      <nav className="flex flex-col py-6">
        <Button variant="ghost" asChild>
          <Link className="flex items-center gap-2" href="/">
            <HomeIcon aria-hidden="true" className="h-5 w-5" />
            <span className="truncate">Home</span>
          </Link>
        </Button>
        <Link className="flex items-center gap-2" href="/notifications">
          <NotificationIcon aria-hidden="true" className="h-5 w-5" />
          <span className="truncate">Notifications</span>
        </Link>
        <Link
          className="flex items-center gap-2"
          href={user ? `/profile/${user.id}` : `/auth/login`}
        >
          <ProfileIcon aria-hidden="true" className="h-5 w-5" />
          <span className="truncate">Profile</span>
        </Link>
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
          <Link href="/about" className="inline-block hover:underline">
            About
          </Link>
          <Link href="/privacy" className="inline-block hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="inline-block hover:underline">
            Terms
          </Link>
        </div>
      </footer>
    </section>
  );
};

const AsideHeader = () => (
  <div className="area-aside-header flex items-center justify-end space-x-4 border-b border-b-border">
    <Button variant="ghost">
      <span className="sr-only">Search</span>
      <SearchIcon className="h-6 w-6" aria-hidden="true" />
    </Button>
  </div>
);
