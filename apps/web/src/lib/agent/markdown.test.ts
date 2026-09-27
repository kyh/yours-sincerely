import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  renderHomeMarkdown,
  renderLetterMarkdown,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "./markdown";
import { contactPage, privacyPage } from "./site-pages";

import type { MarkdownLetter } from "./markdown";

const letter = (overrides: Partial<MarkdownLetter> = {}): MarkdownLetter => ({
  commentCount: 2,
  content: "Dear you,\n\nI never said it.",
  createdAt: "2026-09-20T10:00:00.000Z",
  createdBy: "Anonymous",
  id: "p1",
  likeCount: 5,
  ...overrides,
});

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
    assert.ok(body.includes("[im.kaiyu@gmail.com](mailto:im.kaiyu@gmail.com)"));
    assert.ok(body.includes("\n- Questions about how the service works"));
  });

  test("carries the privacy policy's update date", () => {
    assert.ok(renderProsePageMarkdown(privacyPage).includes("Last updated: "));
  });

  test("trust pages carry real content, not a stub", () => {
    for (const page of [contactPage, privacyPage]) {
      assert.ok(renderProsePageMarkdown(page).length >= 500, page.path);
    }
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
