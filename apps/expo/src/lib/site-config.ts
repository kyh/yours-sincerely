/** Mirrors apps/web/src/lib/site-config.ts. */
export const siteConfig = {
  name: "Yours Sincerely",
  shortName: "Yours Sincerely",
  description: "Anonymous love letters written in disappearing ink.",
  url: "https://yourssincerely.org",
  twitter: "@kaiyuhsu",
  supportEmail: "kai@kyh.io",
};

/** Same subject line the web menu uses, so support mail can be traced to an
    account; percent-encoded because `Linking.openURL` rejects raw spaces. */
export const supportMailto = (userId: string | undefined) =>
  `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(`Support: ${userId ?? "anonymous"}`)}`;
