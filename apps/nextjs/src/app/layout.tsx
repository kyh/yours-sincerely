import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GlobalAlertDialog } from "@repo/ui/alert-dialog";
import { ThemeProvider } from "@repo/ui/theme";
import { GlobalToaster } from "@repo/ui/toast";
import { TooltipProvider } from "@repo/ui/tooltip";
import { cn } from "@repo/ui/utils";

import { CapacitorProvider } from "@/components/providers/capacitor-provider";
import { siteConfig } from "@/lib/site-config";
import { TRPCReactProvider } from "@/trpc/react";

import "@knocklabs/react/dist/index.css";
import "./styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `${siteConfig.name} | %s`,
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
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      url: `${siteConfig.url}/favicon/favicon-96x96.png`,
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      url: `${siteConfig.url}/favicon/favicon.svg`,
    },
    {
      rel: "shortcut icon",
      url: `${siteConfig.url}/favicon/favicon.ico`,
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: `${siteConfig.url}/favicon/apple-touch-icon.png`,
    },
    {
      rel: "manifest",
      url: `${siteConfig.url}/favicon/site.webmanifest`,
    },
  ],
  other: {
    "apple-mobile-web-app-title": siteConfig.shortName,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

type LayoutProps = {
  children: React.ReactNode;
};

const RootLayout = (props: LayoutProps) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground font-sans antialiased",
          fontSans.variable,
        )}
      >
        <CapacitorProvider>
          <ThemeProvider>
            <TooltipProvider>
              <TRPCReactProvider>{props.children}</TRPCReactProvider>
              <GlobalToaster />
              <GlobalAlertDialog />
            </TooltipProvider>
          </ThemeProvider>
        </CapacitorProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
