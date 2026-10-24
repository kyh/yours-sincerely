import type { MetadataRoute } from "next";
import { parseServerDate } from "@repo/contract/content";

import type { FeedPost, RouterOutputs } from "@repo/contract";
import { letterPath } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { caller } from "@/orpc/server";

// Letters come and go by the hour, and the build has no database to read.
export const dynamic = "force-dynamic";

/** The feed holds exactly the letters whose ink has not faded, newest first. */
const SITEMAP_PAGE_SIZE = 50;
const MAX_LETTERS = 1000;

const liveLetters = async (): Promise<FeedPost[]> => {
  const letters: FeedPost[] = [];
  let cursor: RouterOutputs["post"]["getFeed"]["nextCursor"];
  do {
    const page = await caller.post.getFeed({ cursor, limit: SITEMAP_PAGE_SIZE });
    letters.push(...page.posts);
    cursor = page.nextCursor;
  } while (cursor && letters.length < MAX_LETTERS);
  return letters.slice(0, MAX_LETTERS);
};

const staticPages = (): MetadataRoute.Sitemap => [
  { changeFrequency: "daily", lastModified: new Date(), priority: 1, url: siteConfig.url },
  {
    changeFrequency: "monthly",
    lastModified: new Date(),
    priority: 0.9,
    url: `${siteConfig.url}/about`,
  },
  ...["/contact", "/terms", "/privacy"].map((path) => ({
    changeFrequency: "monthly" as const,
    lastModified: new Date(),
    priority: 0.8,
    url: `${siteConfig.url}${path}`,
  })),
];

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  let letters: FeedPost[] = [];
  try {
    letters = await liveLetters();
  } catch (error) {
    // The standing pages still deserve a sitemap while the database is down.
    console.error("sitemap: could not read the feed", error);
  }

  return [
    ...staticPages(),
    ...letters.map((letter) => ({
      changeFrequency: "weekly" as const,
      lastModified: parseServerDate(letter.createdAt),
      priority: 0.6,
      url: `${siteConfig.url}${letterPath(letter.id)}`,
    })),
  ];
};

export default sitemap;
