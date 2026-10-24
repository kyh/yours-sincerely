import type { Metadata } from "next";
import { getExpiryProgress, parseServerDate } from "@repo/contract/content";

import { siteConfig } from "@/lib/site-config";

/** The site-wide share card, `public/og.jpg`. */
export const OG_IMAGE = {
  alt: `${siteConfig.name}: ${siteConfig.description}`,
  height: 1080,
  url: "/og.jpg",
  width: 1920,
} as const;

/** The og:video, rendered by `pnpm og:video` (`apps/web/scripts/og-video.mjs`):
    a letter writes itself in the app's card styling, then its ink fades. */
export const OG_VIDEO = {
  description:
    "A love letter writes itself line by line on a Yours Sincerely card, holds a beat, then its disappearing ink fades away.",
  durationSeconds: 8,
  height: 630,
  name: `${siteConfig.name}: a letter in disappearing ink`,
  poster: "/og/og-poster.jpg",
  /** The day the clip was committed. Bump it when the clip is re-rendered. */
  uploadDate: "2026-10-24",
  url: "/og/og.mp4",
  width: 1200,
} as const;

const absolute = (path: string) => `${siteConfig.url}${path}`;

const ogVideoTag = {
  height: OG_VIDEO.height,
  secureUrl: absolute(OG_VIDEO.url),
  type: "video/mp4",
  url: absolute(OG_VIDEO.url),
  width: OG_VIDEO.width,
};

interface PageMetadataInput {
  /** Site path, also the canonical URL. */
  path: string;
  title?: string;
  description?: string;
  /** The og:video plays on the marketing pages, not on a letter's own card. */
  video?: boolean;
}

/** Child metadata replaces the root's `openGraph` and `twitter` wholesale, so a
    page that needs its own `og:url` restates every field here once. */
export const pageMetadata = ({
  path,
  title,
  description = siteConfig.description,
  video = true,
}: PageMetadataInput): Metadata => {
  const shareTitle = title ? `${siteConfig.name} | ${title}` : siteConfig.name;
  const metadata: Metadata = {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      images: [OG_IMAGE],
      locale: "en-US",
      siteName: siteConfig.name,
      title: shareTitle,
      type: "website",
      url: absolute(path === "/" ? "" : path),
      videos: video ? [ogVideoTag] : [],
    },
    twitter: {
      card: "summary_large_image",
      creator: siteConfig.twitter,
      description,
      images: [OG_IMAGE],
      title: shareTitle,
    },
  };
  // Left unset, the root layout's default title applies; an explicit undefined would erase it.
  if (title) {
    metadata.title = title;
  }
  return metadata;
};

export const rootOpenGraphVideos = [ogVideoTag];

/** Screens that are personal or form-only: nothing there is worth a search result. */
export const NOINDEX: Metadata["robots"] = { follow: false, index: false };

const ELLIPSIS = "…";

/** The first `max` characters of a letter, on one line, cut at a word. */
export const letterExcerpt = (content: string, max: number): string => {
  const flat = content.replaceAll(/\s+/gu, " ").trim();
  if (flat.length <= max) {
    return flat;
  }
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}${ELLIPSIS}`;
};

export interface SeoLetter {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  parentId: string | null;
}

export const letterPath = (id: string) => `/posts/${id}`;
export const letterImagePath = (id: string) => `/api/og/letter/${encodeURIComponent(id)}`;

/** A letter whose ink has faded (past the feed window) keeps its permalink, but
    is no longer offered to search engines or quoted in share cards. */
export const isLetterIndexable = (letter: Pick<SeoLetter, "createdAt">, now = new Date()) =>
  !getExpiryProgress(letter.createdAt, now).isExpired;

const FADED_DESCRIPTION = `The disappearing ink on this letter has faded. ${siteConfig.description}`;

export const letterMetadata = (letter: SeoLetter, now = new Date()): Metadata => {
  const live = isLetterIndexable(letter, now);
  const isReply = Boolean(letter.parentId);
  const kind = isReply ? "A reply to a love letter" : "A love letter";
  const title = live ? `“${letterExcerpt(letter.content, 60)}”` : kind;
  const description = live
    ? `${letterExcerpt(letter.content, 150)} (${kind.toLowerCase()} on ${siteConfig.name})`
    : FADED_DESCRIPTION;
  const path = letterPath(letter.id);
  const image = {
    alt: live ? `${kind}: ${letterExcerpt(letter.content, 120)}` : `${kind} whose ink has faded`,
    height: 630,
    url: letterImagePath(letter.id),
    width: 1200,
  };
  const base = pageMetadata({ description, path, title, video: false });

  const metadata: Metadata = {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [image],
      publishedTime: parseServerDate(letter.createdAt).toISOString(),
      type: "article",
    },
    twitter: { ...base.twitter, images: [image] },
  };
  if (!live) {
    metadata.robots = NOINDEX;
  }
  return metadata;
};
