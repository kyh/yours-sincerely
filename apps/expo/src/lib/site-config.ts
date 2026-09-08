/** Mirrors apps/web/src/lib/site-config.ts. */
export const siteConfig = {
  description: "Anonymous love letters written in disappearing ink.",
  name: "Yours Sincerely",
  shortName: "Yours Sincerely",
  supportEmail: "kai@kyh.io",
  twitter: "@kaiyuhsu",
  url: "https://yourssincerely.org",
};

/** Same subject line the web menu uses, so support mail can be traced to an
    account; percent-encoded because `Linking.openURL` rejects raw spaces. */
export const supportMailto = (userId: string | undefined) =>
  `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(`Support: ${userId ?? "anonymous"}`)}`;
