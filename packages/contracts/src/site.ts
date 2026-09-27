import { WEB_HOST } from "./mobile-identity.ts";

export const SITE = {
  description: "Anonymous love letters written in disappearing ink.",
  name: "Yours Sincerely",
  shortName: "Yours Sincerely",
  supportEmail: "kai@kyh.io",
  twitter: "@kaiyuhsu",
} as const;

export const WEB_ORIGIN = `https://${WEB_HOST}`;

/** Percent-encoded: React Native's `Linking.openURL` rejects a mailto with raw
    spaces on some iOS versions. */
const mailto = (subject: string) =>
  `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}`;

/** The subject carries the account id so support mail can be traced to it. */
export const supportMailto = (userId?: string | null) =>
  mailto(`Support: ${userId ?? "anonymous"}`);

export const reportPostMailto = (postId: string) => mailto(`Report YS Post: ${postId}`);
