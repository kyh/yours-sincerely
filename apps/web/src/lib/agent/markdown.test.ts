import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { POST_EXPIRY_DAYS } from "@repo/contract/content";

import {
  renderHomeMarkdown,
  renderLetterMarkdown,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "./markdown";
import { contactPage, headingId, privacyPage, termsPage } from "./site-pages";

import type { MarkdownLetter } from "./markdown";
import type { Block, Inline, ProsePage } from "./site-pages";

const letter = (overrides: Partial<MarkdownLetter> = {}): MarkdownLetter => ({
  commentCount: 2,
  content: "Dear you,\n\nI never said it.",
  createdAt: "2026-09-20T10:00:00.000Z",
  createdBy: "Anonymous",
  id: "p1",
  likeCount: 5,
  ...overrides,
});

/** Every block a page renders, front matter and footnote included. */
const blocksOf = (page: ProsePage): Block[] => [
  ...(page.intro ?? []),
  ...page.sections.flatMap((section) => section.blocks),
  ...(page.footnote ?? []),
];

const inlinesOf = (block: Block): Inline[] => {
  switch (block.kind) {
    case "paragraph": {
      return block.content;
    }
    case "list": {
      return block.items.flat();
    }
    case "table": {
      return [];
    }
    default: {
      const exhaustive: never = block;
      throw new Error(`Unknown block ${String(exhaustive)}`);
    }
  }
};

const hrefsOf = (page: ProsePage): string[] =>
  blocksOf(page)
    .flatMap(inlinesOf)
    .flatMap((part) => (part.kind === "link" ? [part.href] : []));

const headingIdsOf = (page: ProsePage): string[] =>
  page.sections.map((section) => headingId(section.heading));

describe("renderHomeMarkdown", () => {
  test("leads with the product and lists recent letters with permalinks", () => {
    const body = renderHomeMarkdown([letter()]);
    assert.ok(body.startsWith("# Yours Sincerely\n"));
    assert.ok(body.includes("## Recent letters"));
    assert.ok(body.includes("https://yourssincerely.org/posts/p1"));
  });

  test("keeps a multi-paragraph letter inside one quote", () => {
    const body = renderHomeMarkdown([letter()]);
    assert.ok(body.includes("> Dear you,\n>\n> I never said it."));
  });

  test("says so when the feed is empty", () => {
    assert.ok(renderHomeMarkdown([]).includes("No letters are on the feed right now."));
  });
});

describe("renderLetterMarkdown", () => {
  test("renders the letter and its comments", () => {
    const body = renderLetterMarkdown(letter(), [letter({ content: "Me too.", id: "c1" })]);
    assert.ok(body.startsWith("# A letter from Anonymous\n"));
    assert.ok(body.includes("## Comments (1)"));
    assert.ok(body.includes("> Me too."));
  });
});

describe("renderProsePageMarkdown", () => {
  test("renders headings, inline links and lists", () => {
    const body = renderProsePageMarkdown(contactPage);
    assert.ok(body.startsWith("# Contact\n"));
    assert.ok(body.includes("[kai@kyh.io](mailto:kai@kyh.io)"));
    assert.ok(body.includes("\n- Questions about how the service works"));
  });

  test("trust pages carry real content, not a stub", () => {
    for (const page of [contactPage, privacyPage, termsPage]) {
      assert.ok(renderProsePageMarkdown(page).length >= 500, page.path);
    }
  });

  test("renders bold text, rich list items and GFM tables", () => {
    const body = renderProsePageMarkdown(privacyPage);
    assert.ok(body.includes("\n- **Contact data**, such as your email address"));
    assert.ok(
      body.includes("\n| Purpose | Categories of personal information involved | Legal basis |\n"),
    );
    assert.ok(body.includes("\n| --- | --- | --- |\n| Service delivery and operations | "));
    const tables = blocksOf(privacyPage).filter((block) => block.kind === "table");
    assert.equal(tables.length, 2);
    for (const block of tables) {
      assert.ok(block.rows.every((row) => row.length === block.head.length));
    }
  });

  test("states each legal document's date once, in its template's words", () => {
    const privacy = renderProsePageMarkdown(privacyPage);
    const terms = renderProsePageMarkdown(termsPage);
    assert.equal(privacy.split("Effective as of October 3, 2026.").length, 2);
    assert.equal(terms.split("**Version 2.0 Last revised:** October 3, 2026").length, 2);
    assert.ok(!privacy.includes("Last updated"));
  });

  test("ends each legal document with the General Legal credit, after a divider", () => {
    for (const page of [privacyPage, termsPage]) {
      const body = renderProsePageMarkdown(page);
      assert.match(
        body,
        /\n\n---\n\nThis template was prepared and made publicly available by General Legal, PC/u,
      );
      assert.ok(body.endsWith("the deal terms it is used to document.\n"), page.path);
    }
    assert.ok(!renderProsePageMarkdown(contactPage).includes("\n---\n"));
  });

  test("leaves no template placeholder or unchosen alternative behind", () => {
    for (const page of [privacyPage, termsPage]) {
      const body = renderProsePageMarkdown(page);
      assert.doesNotMatch(
        body,
        /<mark>|\[(?:INSERT|DATE|EMAIL|LINK|ADD|Company|Address)|DecisionLayer/iu,
        page.path,
      );
    }
  });

  test("keeps the promises the previous privacy policy made", () => {
    const body = renderProsePageMarkdown(privacyPage);
    for (const promise of [
      "We do not sell your personal information or share it with advertisers.",
      "We never ask for your phone number, real name, postal address or payment details",
      "standard server logs that we use only to keep the Service running and to stop abuse",
      "Law enforcement and government authorities, only when the law requires it",
      "We do not use advertising or social media cookies",
      `Letters leave the public feed ${POST_EXPIRY_DAYS} days after they are published`,
      "The Service is not intended for use by anyone under 13 years of age.",
    ]) {
      assert.ok(body.includes(promise), promise);
    }
    assert.ok(!body.includes("information/know"));
  });

  test("makes site paths absolute, since the twin is read off the site", () => {
    const body = renderProsePageMarkdown(termsPage);
    assert.ok(body.includes("(https://yourssincerely.org/privacy)"));
    assert.ok(body.includes("(https://yourssincerely.org/privacy#tracking--other-technologies)"));
    assert.ok(!body.includes("](/"));
  });
});

describe("headingId", () => {
  test("follows GitHub's heading anchors, so the Markdown twin's links resolve too", () => {
    assert.equal(headingId("How to contact us"), "how-to-contact-us");
    assert.equal(headingId("Tracking & Other Technologies"), "tracking--other-technologies");
    assert.equal(headingId("1. Accounts"), "1-accounts");
  });

  test("gives every heading on a page its own id", () => {
    for (const page of [contactPage, privacyPage, termsPage]) {
      const ids = headingIdsOf(page);
      assert.equal(new Set(ids).size, ids.length, page.path);
    }
  });
});

describe("legal page anchors", () => {
  test("every in-page link lands on a heading of that page", () => {
    for (const page of [contactPage, privacyPage, termsPage]) {
      const ids = new Set(headingIdsOf(page));
      for (const href of hrefsOf(page).filter((target) => target.startsWith("#"))) {
        assert.ok(ids.has(href.slice(1)), `${page.path} ${href}`);
      }
    }
  });

  test("links into the privacy policy land on one of its headings", () => {
    const ids = new Set(headingIdsOf(privacyPage));
    const deepLinks = hrefsOf(termsPage).filter((target) => target.startsWith("/privacy#"));
    assert.ok(deepLinks.length > 0);
    for (const href of deepLinks) {
      assert.ok(ids.has(href.slice("/privacy#".length)), href);
    }
  });

  test("the privacy policy's index lists every section, in order", () => {
    const index = (privacyPage.intro ?? []).find((block) => block.kind === "list");
    assert.ok(index?.kind === "list");
    assert.deepEqual(
      index.items.map((item) => item.flatMap((part) => (part.kind === "link" ? [part.href] : []))),
      headingIdsOf(privacyPage).map((id) => [`#${id}`]),
    );
  });

  test("the terms keep sections 1 through 11 in order, so cross-references hold", () => {
    assert.deepEqual(
      termsPage.sections.map((section) => section.heading.split(".")[0]),
      Array.from({ length: 11 }, (_, index) => String(index + 1)),
    );
  });
});

describe("renderNotFoundMarkdown", () => {
  test("names the path and points at recovery surfaces", () => {
    const body = renderNotFoundMarkdown("/nope");
    assert.ok(body.includes("`/nope`"));
    assert.ok(body.includes("https://yourssincerely.org/llms.txt"));
    assert.ok(body.includes("https://yourssincerely.org/sitemap.xml"));
  });
});
