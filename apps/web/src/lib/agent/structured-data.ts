import { siteConfig } from "@/lib/site-config";

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
});

export const buildSiteGraph = (): JsonLdNode => ({
  "@context": "https://schema.org",
  "@graph": [buildOrganization(), buildWebSite(), buildWebApplication()],
});

/** `<` is escaped so no value can close the surrounding script tag early. */
export const serializeJsonLd = (node: JsonLdNode): string =>
  JSON.stringify(node).replaceAll("<", "\\u003c");
