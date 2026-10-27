import { siteConfig } from "@/lib/site-config";

import { getExpiryProgress, parseServerDate } from "@repo/contract/content";

import { OG_VIDEO, letterExcerpt, letterPath } from "@/lib/seo";
import type { SeoLetter } from "@/lib/seo";

import { absoluteUrl, siteSummary } from "./markdown";

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const APPLICATION_ID = `${siteConfig.url}/#application`;
const VIDEO_ID = `${siteConfig.url}/#video`;

const sameAs = [siteConfig.repository, siteConfig.playStoreUrl];

/** No `address`: a personal open-source project has no premises, and a made-up
    PostalAddress would be worse than the missing field. */
export const buildOrganization = (): JsonLdNode => ({
  "@id": ORGANIZATION_ID,
  "@type": "Organization",
  contactPoint: [
    {
      "@type": "ContactPoint",
      availableLanguage: ["en"],
      contactType: "customer support",
      email: siteConfig.contactEmail,
      url: absoluteUrl("/contact"),
    },
    {
      "@type": "ContactPoint",
      availableLanguage: ["en"],
      contactType: "technical support",
      email: siteConfig.contactEmail,
      url: `${siteConfig.repository}/issues`,
    },
  ],
  description: siteSummary,
  email: siteConfig.contactEmail,
  founder: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
  logo: absoluteUrl("/favicon/favicon-96x96.png"),
  name: siteConfig.name,
  sameAs,
  url: siteConfig.url,
});

export const buildWebSite = (): JsonLdNode => ({
  "@id": WEBSITE_ID,
  "@type": "WebSite",
  description: siteConfig.description,
  inLanguage: "en-US",
  name: siteConfig.name,
  publisher: { "@id": ORGANIZATION_ID },
  url: siteConfig.url,
});

export const buildWebApplication = (): JsonLdNode => ({
  "@id": APPLICATION_ID,
  "@type": "WebApplication",
  applicationCategory: "SocialNetworkingApplication",
  browserRequirements: "Requires JavaScript",
  codeRepository: siteConfig.repository,
  description: siteSummary,
  image: absoluteUrl("/og.jpg"),
  isAccessibleForFree: true,
  name: siteConfig.name,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  operatingSystem: "Web, iOS, Android",
  publisher: { "@id": ORGANIZATION_ID },
  sameAs,
  url: siteConfig.url,
  video: { "@id": VIDEO_ID },
});

/** The og:video, described for search: the same clip every share card plays. */
export const buildVideoObject = (): JsonLdNode => ({
  "@id": VIDEO_ID,
  "@type": "VideoObject",
  contentUrl: absoluteUrl(OG_VIDEO.url),
  description: OG_VIDEO.description,
  duration: `PT${OG_VIDEO.durationSeconds}S`,
  height: OG_VIDEO.height,
  name: OG_VIDEO.name,
  publisher: { "@id": ORGANIZATION_ID },
  thumbnailUrl: absoluteUrl(OG_VIDEO.poster),
  uploadDate: OG_VIDEO.uploadDate,
  width: OG_VIDEO.width,
});

export const buildSiteGraph = (): JsonLdNode => ({
  "@context": "https://schema.org",
  "@graph": [buildOrganization(), buildWebSite(), buildWebApplication(), buildVideoObject()],
});

interface LetterStats {
  likeCount: number;
  commentCount: number;
}

/** One letter's page. The author is the pen name the page itself prints (often
    "Anonymous"), with no profile link: the card never says more than the page. */
export const buildLetterGraph = (letter: SeoLetter & LetterStats, imageUrl: string): JsonLdNode => {
  const url = absoluteUrl(letterPath(letter.id));
  const published = parseServerDate(letter.createdAt).toISOString();
  const { end } = getExpiryProgress(letter.createdAt);
  const isReply = Boolean(letter.parentId);
  const posting: JsonLdNode = {
    "@id": `${url}#letter`,
    "@type": isReply ? "Comment" : "SocialMediaPosting",
    articleBody: letter.content,
    author: { "@type": "Person", name: letter.createdBy },
    datePublished: published,
    expires: end.toISOString(),
    headline: letterExcerpt(letter.content, 110),
    image: imageUrl,
    inLanguage: "en-US",
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: letter.likeCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: letter.commentCount,
      },
    ],
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
    publisher: { "@id": ORGANIZATION_ID },
    url,
  };
  if (letter.parentId) {
    posting.parentItem = { "@id": `${absoluteUrl(letterPath(letter.parentId))}#letter` };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      posting,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: siteConfig.url, name: "Home", position: 1 },
          {
            "@type": "ListItem",
            item: url,
            name: isReply ? "A reply to a love letter" : "A love letter",
            position: 2,
          },
        ],
      },
    ],
  };
};

/** `<` is escaped so no value can close the surrounding script tag early. */
export const serializeJsonLd = (node: JsonLdNode): string =>
  JSON.stringify(node).replaceAll("<", "\\u003c");
