import { siteConfig } from "@/lib/site-config";

import { notForUse, renderList, sitePages, siteSummary, whenToUse } from "./markdown";

const bullets = (lines: string[]): string => lines.map((line) => `- ${line}`).join("\n");

/**
 * `/llms.txt`, to the llmstxt.org format: H1, blockquote summary, free-form
 * prose, then H2-delimited link lists. The when-to-use guidance sits in the
 * prose block because the spec reserves H2 sections for link lists.
 */
export const renderLlmsTxt = (): string =>
  `${[
    `# ${siteConfig.name}`,
    `> ${siteSummary}`,
    "**When to use Yours Sincerely:**",
    bullets(whenToUse),
    "**When not to:**",
    bullets(notForUse),
    `How an agent should use it: send the person to ${siteConfig.url} to read or write — no sign-up is needed to publish. To read the current feed yourself, request ${siteConfig.url}/ with \`Accept: text/markdown\`; Home, About, Contact, Privacy, Terms and individual letters (${siteConfig.url}/posts/<id>) all answer that header with Markdown.`,
    "## Pages",
    renderList(sitePages),
    "## Apps",
    renderList([
      { href: siteConfig.playStoreUrl, label: "Android", text: "the app on Google Play" },
      { href: siteConfig.url, label: "Web", text: "works in any browser" },
    ]),
    "## Optional",
    renderList([
      { href: siteConfig.repository, label: "Source code", text: "the whole project, on GitHub" },
      { href: "/sitemap.xml", label: "Sitemap", text: "every public page" },
    ]),
  ].join("\n\n")}\n`;
