import type { Metadata } from "next";
import { getExpiryProgress, parseServerDate } from "@repo/contract/content";

import { contactPage, privacyPage, termsPage } from "@/lib/agent/site-pages";
import { siteConfig } from "@/lib/site-config";

/** The site-wide share card, `public/og.jpg`. */
export const OG_IMAGE = {
  alt: `${siteConfig.name}: ${siteConfig.description}`,
  height: 1080,
  url: "/og.jpg",
  width: 1920,
} as const;

/** The og:video, rendered by `pnpm og:video` (`apps/web/scripts/og-video.mjs`):
    beside the logo icon and tagline, a letter card arrives, writes, is liked,
    and its ink fades word by word before the card floats away. */
export const OG_VIDEO = {
  description:
    "Beside the Yours Sincerely icon and tagline, a letter card springs into place, a love letter writes itself and is signed and liked, then its disappearing ink lifts away word by word as the expiry ring runs out and the empty card floats off.",
  durationSeconds: 7,
  height: 630,
  name: `${siteConfig.name}: a letter in disappearing ink`,
  poster: "/og/og-poster.jpg",
  /** The day the clip was committed. Bump it when the clip is re-rendered. */
  uploadDate: "2026-10-25",
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

/** Every card `src/lib/share-card.tsx` draws is this size. */
export const SHARE_CARD_SIZE = { height: 630, width: 1200 } as const;

export interface PageCard {
  path: string;
  title: string;
  description: string;
}

/** The standing pages that get a share card of their own, drawn at
    `/api/og/page/<key>`. The home page keeps `og.jpg`. */
export const PAGE_CARDS = {
  about: {
    description:
      "Stories about us, written by you: an ephemeral, anonymous public art project for tiny beautiful letters in disappearing ink.",
    path: "/about",
    title: "About",
  },
  contact: contactPage,
  privacy: privacyPage,
  terms: termsPage,
} as const satisfies Record<string, PageCard>;

export type PageCardKey = keyof typeof PAGE_CARDS;

export const isPageCardKey = (value: string): value is PageCardKey =>
  Object.hasOwn(PAGE_CARDS, value);

export const pageCardPath = (key: PageCardKey) => `/api/og/page/${key}`;

/** A card drawn by `src/lib/share-card.tsx`: a URL and what it shows. */
interface ShareCardImage {
  url: string;
  alt: string;
}

interface PageMetadataInput {
  /** Site path, also the canonical URL. */
  path: string;
  title?: string;
  description?: string;
  /** The page's own share card; without one it shares `og.jpg`. */
  card?: ShareCardImage;
  /** The og:video plays on the marketing pages, not on a letter's own card. */
  video?: boolean;
}

/** The one place og:image and twitter:image are spelled, with their size and alt. */
const shareImage = (card: ShareCardImage | undefined) =>
  card ? { ...SHARE_CARD_SIZE, alt: card.alt, url: card.url } : OG_IMAGE;

/** Child metadata replaces the root's `openGraph` and `twitter` wholesale, so a
    page that needs its own `og:url` restates every field here once. */
export const pageMetadata = ({
  path,
  title,
  description = siteConfig.description,
  card,
  video = true,
}: PageMetadataInput): Metadata => {
  const image = shareImage(card);
  const shareTitle = title ? `${siteConfig.name} | ${title}` : siteConfig.name;
  const metadata: Metadata = {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      images: [image],
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
      images: [image],
      title: shareTitle,
    },
  };
  // Left unset, the root layout's default title applies; an explicit undefined would erase it.
  if (title) {
    metadata.title = title;
  }
  return metadata;
};

/** A standing page's metadata, its share card drawn from `PAGE_CARDS`. */
export const pageCardMetadata = (key: PageCardKey, options: { video?: boolean } = {}) => {
  const page = PAGE_CARDS[key];
  return pageMetadata({
    card: { alt: `${siteConfig.name}: ${page.title}. ${page.description}`, url: pageCardPath(key) },
    description: page.description,
    path: page.path,
    title: page.title,
    video: options.video ?? false,
  });
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
  const card = {
    alt: live ? `${kind}: ${letterExcerpt(letter.content, 120)}` : `${kind} whose ink has faded`,
    url: letterImagePath(letter.id),
  };
  const base = pageMetadata({ card, description, path, title, video: false });

  const metadata: Metadata = {
    ...base,
    openGraph: {
      ...base.openGraph,
      publishedTime: parseServerDate(letter.createdAt).toISOString(),
      type: "article",
    },
  };
  if (!live) {
    metadata.robots = NOINDEX;
  }
  return metadata;
};
