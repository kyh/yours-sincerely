import assert from "node:assert/strict";
import { test } from "node:test";

import { renderLlmsTxt } from "./llms-txt";

const body = renderLlmsTxt();

test("follows the llmstxt.org shape: H1, then a blockquote summary", () => {
  const [h1, blank, summary] = body.split("\n");
  assert.equal(h1, "# Yours Sincerely");
  assert.equal(blank, "");
  assert.ok(summary?.startsWith("> "));
});

test("tells agents when to use the product", () => {
  assert.ok(body.includes("**When to use Yours Sincerely:**"));
  assert.ok(body.includes("**When not to:**"));
});

test("keeps prose out of H2 sections, which the spec reserves for link lists", () => {
  const sections = body.split("\n## ").slice(1);
  assert.ok(sections.length > 0);
  for (const section of sections) {
    const lines = section.split("\n").slice(1).filter(Boolean);
    assert.ok(
      lines.every((line) => line.startsWith("- [")),
      section,
    );
  }
});

test("uses absolute links", () => {
  assert.ok(body.includes("(https://yourssincerely.org/about)"));
  assert.ok(!body.includes("](/"));
});
