import { POST_EXPIRY_DAYS } from "@repo/contracts/content";

import { siteConfig } from "@/lib/site-config";

export type Inline = { kind: "text"; text: string } | { kind: "link"; href: string; label: string };

export type Block = { kind: "paragraph"; content: Inline[] } | { kind: "list"; items: string[] };

export interface Section {
  heading: string;
  blocks: Block[];
}

/** One source for a page's HTML and its Markdown twin, so the two cannot drift. */
export interface ProsePage {
  path: string;
  title: string;
  description: string;
  updated?: string;
  sections: Section[];
}

const p = (...content: Inline[]): Block => ({ content, kind: "paragraph" });
const list = (...items: string[]): Block => ({ items, kind: "list" });
const t = (text: string): Inline => ({ kind: "text", text });
const link = (href: string, label: string): Inline => ({ href, kind: "link", label });
const email = link(`mailto:${siteConfig.contactEmail}`, siteConfig.contactEmail);
const repo = link(siteConfig.repository, "github.com/kyh/yours-sincerely");
const issues = link(`${siteConfig.repository}/issues`, "GitHub issues");

export const contactPage: ProsePage = {
  description: `How to reach the person who runs ${siteConfig.name}.`,
  path: "/contact",
  sections: [
    {
      blocks: [
        p(
          t(
            `${siteConfig.name} is a small, independent project built and run by ${siteConfig.author.name}. There is no support team or ticket queue — every message is read by the person who wrote the code, so please be patient with replies.`,
          ),
        ),
      ],
      heading: "Who you are talking to",
    },
    {
      blocks: [
        p(t("Email "), email, t(" for anything about the site or the apps:")),
        list(
          "Questions about how the service works, or about your account",
          "Requests to delete letters or data you cannot remove yourself in Settings",
          "Privacy questions, or anything covered by the privacy policy",
          "Press, partnerships, or just saying hello",
        ),
      ],
      heading: "Email",
    },
    {
      blocks: [
        p(
          t(
            "To report a letter that breaks the rules, use the report option on the letter itself — it reaches moderation fastest and keeps the letter's id attached. If a letter puts someone in danger, also email ",
          ),
          email,
          t(" with a link to it."),
        ),
      ],
      heading: "Reporting a letter",
    },
    {
      blocks: [
        p(
          t(
            `${siteConfig.name} is open source. Bugs, feature ideas and code contributions are welcome on `,
          ),
          issues,
          t(". The full source lives at "),
          repo,
          t("."),
        ),
      ],
      heading: "Bugs and code",
    },
  ],
  title: "Contact",
};

export const privacyPage: ProsePage = {
  description: `What ${siteConfig.name} collects, why, who processes it, and how to delete it.`,
  path: "/privacy",
  sections: [
    {
      blocks: [
        p(
          t(
            `${siteConfig.name} is an open-source project built and run by ${siteConfig.author.name}, provided at no cost. This policy covers the website at ${siteConfig.url} and the iOS and Android apps. The code that does everything described here is public at `,
          ),
          repo,
          t(", so every claim below can be checked."),
        ),
      ],
      heading: "Introduction",
    },
    {
      blocks: [
        p(
          t(
            "You can write without an account. The first time you publish, the service creates an anonymous account with no email, no password and no name, and remembers it with a signed session cookie. If you choose to sign up, we store:",
          ),
        ),
        list(
          "Your email address, used to sign in and to send password-reset links",
          "A salted hash of your password — never the password itself",
          "The display name and avatar you choose, if any",
        ),
        p(t("We never ask for a phone number, a real name, a postal address or payment details.")),
      ],
      heading: "Your account",
    },
    {
      blocks: [
        list(
          `Letters and comments you publish, with their time and the name you chose to sign them with. Letters leave the public feed after ${POST_EXPIRY_DAYS} days.`,
          "Likes, reports and blocks you make, so they apply to you and moderation works",
          "Notifications about replies to your letters",
          "A push-notification token, only if you allow notifications in the mobile app",
        ),
        p(
          t(
            "Letters and comments are public: anyone who can see the feed can read them. Only write what you are comfortable sharing with strangers.",
          ),
        ),
      ],
      heading: "What you create",
    },
    {
      blocks: [
        list(
          "One session cookie that keeps you signed in, including as an anonymous writer. We use no advertising or cross-site tracking cookies.",
          "Anonymous page-view analytics through Vercel Web Analytics, which counts visits without cookies and without identifying you.",
          "Standard server logs kept by our hosting provider (such as IP address and browser type), used only to keep the service running and to stop abuse.",
        ),
      ],
      heading: "What is collected automatically",
    },
    {
      blocks: [
        p(t("We do not sell your data or share it with advertisers. It is processed only by:")),
        list(
          "Vercel — hosts the website and provides the analytics",
          "Supabase — hosts the database",
          "Resend — delivers password-reset emails",
          "Expo, Apple and Google — deliver push notifications to the mobile apps",
        ),
        p(t("We disclose information to authorities only when the law requires it.")),
      ],
      heading: "Who processes it",
    },
    {
      blocks: [
        p(
          t(
            "Deleting your account in Settings permanently removes your account, every letter and comment you wrote, and your likes, reports, blocks, notifications and push tokens. You can also delete individual letters at any time. For anything else — a copy of your data, or help deleting it — email ",
          ),
          email,
          t("."),
        ),
      ],
      heading: "Your choices",
    },
    {
      blocks: [
        p(
          t(
            "The service is not intended for anyone under 13, and we do not knowingly collect information from children under 13.",
          ),
        ),
      ],
      heading: "Children",
    },
    {
      blocks: [
        p(
          t(
            "If this policy changes, the updated version will be posted on this page with a new date. Questions go to ",
          ),
          email,
          t("."),
        ),
      ],
      heading: "Changes and contact",
    },
  ],
  title: "Privacy Policy",
  updated: "September 26, 2026",
};
