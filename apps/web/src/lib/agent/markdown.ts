import { POST_EXPIRY_DAYS } from "@repo/contract/content";

import { siteConfig } from "@/lib/site-config";

import type { Block, Inline, ProsePage } from "./site-pages";

export interface LinkItem {
  href: string;
  label: string;
  text: string;
}

export interface MarkdownLetter {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  likeCount: number;
  commentCount: number;
}

export const absoluteUrl = (path: string): string =>
  path.startsWith("http") || path.startsWith("mailto:") ? path : `${siteConfig.url}${path}`;

export const siteSummary = `${siteConfig.name} is a free, open-source space for anonymous letters written in disappearing ink: anyone can publish a short letter without an account, and every letter fades from the public feed after ${POST_EXPIRY_DAYS} days.`;

export const howItWorks = `Writers publish as "Anonymous" or under any name they pick. Readers can like and reply to letters. Each letter shows how much of its ${POST_EXPIRY_DAYS}-day life is left, then disappears from the feed.`;

export const artProject = `It is a public art project with optional anonymity — a direct channel to the inner lives of other people who, in other contexts, rarely reveal such vulnerability. Think of it as a magical graffiti wall in a busy part of town: notes to no one, tiny beautiful letters to each other, signed "Yours Sincerely, Anonymous".`;

export const whereItRuns = `${siteConfig.name} runs on the web at ${siteConfig.url} and as native apps for iOS and Android. It is built and maintained by ${siteConfig.author.name} (${siteConfig.author.url}), and the source is open at ${siteConfig.repository}.`;

export const whenToUse = [
  "Someone wants to write something honest — a love letter, an apology, a confession, a note to no one — and share it without their name attached.",
  "Someone wants to read what strangers are feeling right now, as short, sincere, anonymous letters.",
  "Someone wants a low-pressure writing outlet that does not keep a permanent public record: letters leave the feed on their own.",
  "Someone asks for an anonymous letter-writing app on the web, iOS or Android.",
];

export const notForUse = [
  "Private messaging to a specific person: letters are public to everyone.",
  "Crisis support: it is not a counselling service. Point people in danger to local emergency services.",
  "Automated posting: there is no public API, and letters should be written by people.",
];

export const sitePages: LinkItem[] = [
  { href: "/", label: "Home", text: "the live feed of recent letters" },
  { href: "/about", label: "About", text: "what the project is and why it exists" },
  { href: "/contact", label: "Contact", text: "email and GitHub" },
  {
    href: "/privacy",
    label: "Privacy",
    text: "the Privacy Policy, covering what is collected, who processes it, and your rights",
  },
  { href: "/terms", label: "Terms", text: "the Terms of Use, including how disputes are resolved" },
];

export const renderList = (items: LinkItem[]): string =>
  items.map((item) => `- [${item.label}](${absoluteUrl(item.href)}): ${item.text}`).join("\n");

/** A site path becomes absolute, since the twin is read away from the site; a
    `#heading` anchor and any other scheme stay as written. */
const markdownHref = (href: string): string => (href.startsWith("/") ? absoluteUrl(href) : href);

const renderInlinePart = (part: Inline): string => {
  switch (part.kind) {
    case "text": {
      return part.text;
    }
    case "strong": {
      return `**${part.text}**`;
    }
    case "link": {
      return `[${part.label}](${markdownHref(part.href)})`;
    }
    default: {
      const exhaustive: never = part;
      throw new Error(`Unknown inline ${String(exhaustive)}`);
    }
  }
};

const renderInline = (content: Inline[]): string => content.map(renderInlinePart).join("");

/** A GFM table row. A pipe inside a cell would end it early, so it is escaped. */
const renderTableRow = (cells: string[]): string =>
  `| ${cells.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`;

const renderBlock = (block: Block): string => {
  switch (block.kind) {
    case "paragraph": {
      return renderInline(block.content);
    }
    case "list": {
      return block.items.map((item) => `- ${renderInline(item)}`).join("\n");
    }
    case "table": {
      return [
        renderTableRow(block.head),
        renderTableRow(block.head.map(() => "---")),
        ...block.rows.map(renderTableRow),
      ].join("\n");
    }
    default: {
      const exhaustive: never = block;
      throw new Error(`Unknown block ${String(exhaustive)}`);
    }
  }
};

const recoveryLinks = (): string =>
  renderList([
    ...sitePages,
    { href: "/llms.txt", label: "llms.txt", text: "a guide to this site for agents" },
    { href: "/sitemap.xml", label: "Sitemap", text: "every public page" },
  ]);

/** A quoted letter. Every line is prefixed so a letter's own blank lines cannot end the quote. */
const quote = (text: string): string =>
  text
    .trim()
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n");

const letterDate = (createdAt: string): string => createdAt.slice(0, 10);

export const renderLetter = (letter: MarkdownLetter): string =>
  [
    `### ${letter.createdBy}, ${letterDate(letter.createdAt)}`,
    "",
    quote(letter.content),
    "",
    `${letter.likeCount} likes · ${letter.commentCount} comments · ${absoluteUrl(`/posts/${letter.id}`)}`,
  ].join("\n");

const joinSections = (sections: string[]): string => `${sections.join("\n\n").trimEnd()}\n`;

export const renderHomeMarkdown = (letters: MarkdownLetter[]): string =>
  joinSections([
    `# ${siteConfig.name}`,
    `> ${siteConfig.description}`,
    siteSummary,
    howItWorks,
    "## Recent letters",
    letters.length > 0
      ? letters.map(renderLetter).join("\n\n")
      : "No letters are on the feed right now. Be the first to write one.",
    "## Pages",
    renderList(sitePages),
  ]);

export const renderLetterMarkdown = (letter: MarkdownLetter, comments: MarkdownLetter[]): string =>
  joinSections([
    `# A letter from ${letter.createdBy}`,
    `Published ${letterDate(letter.createdAt)} on ${siteConfig.name}. ${letter.likeCount} likes.`,
    quote(letter.content),
    `## Comments (${comments.length})`,
    comments.length > 0 ? comments.map(renderLetter).join("\n\n") : "No comments yet.",
    `[Read more letters](${absoluteUrl("/")})`,
  ]);

export const renderAboutMarkdown = (): string =>
  joinSections([
    `# About ${siteConfig.name}`,
    "> Stories about us, written by you.",
    siteSummary,
    artProject,
    whereItRuns,
    "## Pages",
    renderList(sitePages),
  ]);

/** Headings carry no explicit id: a `## Heading` gets `headingId(heading)` from
    any GitHub-style renderer, which is what the page's `#links` name. */
export const renderProsePageMarkdown = (page: ProsePage): string =>
  joinSections([
    `# ${page.title}`,
    `> ${page.description}`,
    ...(page.intro ?? []).map(renderBlock),
    ...page.sections.map((section) =>
      [`## ${section.heading}`, ...section.blocks.map(renderBlock)].join("\n\n"),
    ),
    ...(page.footnote ? ["---", ...page.footnote.map(renderBlock)] : []),
  ]);

export const renderNotFoundMarkdown = (pathname: string): string =>
  joinSections([
    "# Page not found",
    `There is no page at \`${pathname}\` on ${siteConfig.name}. Letters disappear from the feed after ${POST_EXPIRY_DAYS} days, and a deleted letter's link stops working.`,
    "## Where to go instead",
    recoveryLinks(),
  ]);
