import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { cn } from "cn";

import { CapacitorProvider } from "@/components/providers/capacitor-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { siteConfig } from "@/lib/site-config";
import { ORPCReactProvider } from "@/orpc/react";

import "./styles/globals.css";

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: [
    {
      rel: "icon",
      sizes: "96x96",
      type: "image/png",
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
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        height: 1080,
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
      },
    ],
    locale: "en-US",
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
  other: {
    "apple-mobile-web-app-title": siteConfig.shortName,
  },
  title: {
    default: siteConfig.name,
    template: `${siteConfig.name} | %s`,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitter,
    description: siteConfig.description,
    images: [
      {
        height: 1080,
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
      },
    ],
    title: siteConfig.name,
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
  userScalable: false,
  viewportFit: "cover",
  width: "device-width",
};

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

interface LayoutProps {
  children: React.ReactNode;
}

const RootLayout = (props: LayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <body className={cn("bg-background text-foreground font-sans antialiased", fontSans.variable)}>
      <CapacitorProvider>
        <MotionProvider>
          <ThemeProvider>
            <TooltipProvider>
              <ORPCReactProvider>{props.children}</ORPCReactProvider>
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </MotionProvider>
      </CapacitorProvider>
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
