import { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";
import { api } from "@/trpc/server";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const defaultPages = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  const { posts } = await api.post.getFeed({});

  const sitemap = [
    ...defaultPages,
    ...posts.map((post) => ({
      url: `${siteConfig.url}/posts/${post.id}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: "never" as const,
      priority: 0.8,
    })),
  ];

  return sitemap;
};

export default sitemap;
