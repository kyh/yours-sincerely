import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@init/ui/theme";
import { Toaster } from "@init/ui/toast";
import { cn } from "@init/ui/utils";

import { siteConfig } from "@/lib/config";
import { TRPCReactProvider } from "@/trpc/react";

import "./globals.css";
import "@knocklabs/react-notification-feed/dist/index.css";

import Link from "next/link";
import { Logo } from "@init/ui/logo";
import { TooltipProvider } from "@init/ui/tooltip";

import { AsideHeader } from "@/components/layout/aside-header";
import { Sidebar } from "@/components/layout/sidebar";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    locale: "en-US",
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
    creator: siteConfig.twitter,
  },
  icons: [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: `${siteConfig.url}/favicon/apple-touch-icon.png`,
    },
    {
      rel: "icon",
      sizes: "32x32",
      url: `${siteConfig.url}/favicon/favicon-32x32.png`,
    },
    {
      rel: "icon",
      sizes: "16x16",
      url: `${siteConfig.url}/favicon/favicon-16x16.png`,
    },
    {
      rel: "mask-icon",
      color: "#000000",
      url: `${siteConfig.url}/favicon/safari-pinned-tab.svg`,
    },
  ],
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
  const currentUser = await api.account.me();

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
            <TooltipProvider delayDuration={0}>
              <section className="page-layout mx-auto min-h-dvh max-w-3xl px-5 lg:max-w-screen-xl">
                <div className="area-nav-header flex items-center border-b border-b-border">
                  <Link href="/">
                    <Logo />
                  </Link>
                </div>
                <Sidebar user={currentUser} />
                {children}
                <AsideHeader user={currentUser} />
              </section>
            </TooltipProvider>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default Layout;
