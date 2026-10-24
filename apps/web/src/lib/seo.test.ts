import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PAGE_CARDS,
  isPageCardKey,
  letterExcerpt,
  letterMetadata,
  pageCardMetadata,
  pageMetadata,
} from "./seo";

const NOW = new Date("2026-10-24T12:00:00Z");

const letter = {
  content: "Dear you,\n\nThank you for the small kindness this morning.",
  createdAt: "2026-10-20 09:30:00",
  createdBy: "Anonymous",
  id: "abc123",
  parentId: "",
};

test("an excerpt is one line and cut at a word", () => {
  assert.equal(letterExcerpt("one\n\ntwo   three", 50), "one two three");
  const cut = letterExcerpt("the quick brown fox jumps over the lazy dog", 20);
  assert.ok(cut.length <= 20, cut);
  assert.ok(cut.endsWith("…"));
  assert.ok(!cut.includes("jum"));
});

test("a marketing page is canonical, shares its own URL and plays the og:video", () => {
  const meta = pageMetadata({ path: "/about", title: "About" });
  assert.equal(meta.alternates?.canonical, "/about");
  assert.equal(
    JSON.stringify(meta.openGraph).includes('"url":"https://yourssincerely.org/about"'),
    true,
  );
  assert.ok(JSON.stringify(meta.openGraph).includes("/og/og.mp4"));
});

test("a live letter gets its own title, card image and article type", () => {
  const meta = letterMetadata(letter, NOW);
  assert.equal(meta.title, "“Dear you, Thank you for the small kindness this morning.”");
  assert.equal(meta.alternates?.canonical, "/posts/abc123");
  assert.equal(meta.robots, undefined);
  const og = JSON.stringify(meta.openGraph);
  assert.ok(og.includes('"type":"article"'));
  assert.ok(og.includes("/api/og/letter/abc123"));
  assert.ok(!og.includes("og.mp4"));
});

test("a letter whose ink has faded is noindex and quotes none of its words", () => {
  const meta = letterMetadata({ ...letter, createdAt: "2026-09-01 09:30:00" }, NOW);
  assert.deepEqual(meta.robots, { follow: false, index: false });
  const shared = JSON.stringify([meta.title, meta.description, meta.openGraph, meta.twitter]);
  assert.ok(!shared.includes("kindness"));
});

test("every standing page shares its own drawn card, and the home page keeps og.jpg", () => {
  for (const key of Object.keys(PAGE_CARDS).filter(isPageCardKey)) {
    const meta = pageCardMetadata(key);
    const shared = JSON.stringify([meta.openGraph, meta.twitter]);
    assert.ok(shared.includes(`/api/og/page/${key}`), key);
    assert.ok(shared.includes('"width":1200') && shared.includes('"height":630'), key);
    assert.ok(!shared.includes("og.jpg"), key);
    assert.equal(meta.alternates?.canonical, PAGE_CARDS[key].path);
  }
  assert.ok(JSON.stringify(pageMetadata({ path: "/" }).openGraph).includes("/og.jpg"));
});
