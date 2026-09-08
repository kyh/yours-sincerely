import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    changeFrequency: "daily",
    lastModified: new Date(),
    priority: 1,
    url: siteConfig.url,
  },
  {
    changeFrequency: "monthly",
    lastModified: new Date(),
    priority: 0.9,
    url: `${siteConfig.url}/about`,
  },
  {
    changeFrequency: "monthly",
    lastModified: new Date(),
    priority: 0.8,
    url: `${siteConfig.url}/terms`,
  },
  {
    changeFrequency: "monthly",
    lastModified: new Date(),
    priority: 0.8,
    url: `${siteConfig.url}/privacy`,
  },
];

export default sitemap;
