import type { MetadataRoute } from "next";
import { parseServerDate } from "@repo/contract/server-date";

import type { FeedPost, RouterOutputs } from "@repo/contract";
import { letterPath } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { caller } from "@/orpc/server";

export const dynamic = "force-dynamic";

const SITEMAP_PAGE_SIZE = 50;
const MAX_LETTERS = 1000;

const liveLetters = async () => {
  const letters: FeedPost[] = [];
  let cursor: RouterOutputs["post"]["getFeed"]["nextCursor"];

  do {
    const page = await caller.post.getFeed({ cursor, limit: SITEMAP_PAGE_SIZE });
    letters.push(...page.posts);
    cursor = page.nextCursor;
  } while (cursor && letters.length < MAX_LETTERS);

  return letters.slice(0, MAX_LETTERS);
};

const staticPages = () =>
  [
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
  ] satisfies MetadataRoute.Sitemap;

const sitemap = async () => {
  let letters: FeedPost[] = [];

  try {
    letters = await liveLetters();
  } catch (error) {
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

export default sitemap satisfies () => Promise<MetadataRoute.Sitemap>;
