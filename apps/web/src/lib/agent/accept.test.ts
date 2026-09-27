import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { negotiateMediaType, notAcceptableBody, withVaryAccept } from "./accept";

describe("negotiateMediaType", () => {
  test("defaults to HTML when the client states no constraint", () => {
    assert.equal(negotiateMediaType(null), "text/html");
    assert.equal(negotiateMediaType(""), "text/html");
    assert.equal(negotiateMediaType("   "), "text/html");
    assert.equal(negotiateMediaType("*/*"), "text/html");
    assert.equal(negotiateMediaType("garbage-without-a-slash"), "text/html");
  });

  test("serves Markdown when the client asks for it", () => {
    assert.equal(negotiateMediaType("text/markdown"), "text/markdown");
    assert.equal(negotiateMediaType("text/markdown, text/html"), "text/markdown");
    assert.equal(negotiateMediaType("TEXT/MARKDOWN"), "text/markdown");
    assert.equal(negotiateMediaType("text/markdown;charset=utf-8"), "text/markdown");
  });

  test("serves HTML to a browser's Accept header", () => {
    const browser =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
    assert.equal(negotiateMediaType(browser), "text/html");
  });

  test("ranks by q-value before client order", () => {
    assert.equal(negotiateMediaType("text/html;q=0.5, text/markdown;q=0.9"), "text/markdown");
    assert.equal(negotiateMediaType("text/markdown;q=0.2, text/html;q=0.8"), "text/html");
  });

  test("breaks equal-quality ties on the client's own ordering", () => {
    assert.equal(negotiateMediaType("text/markdown, text/html"), "text/markdown");
    assert.equal(negotiateMediaType("text/html, text/markdown"), "text/html");
  });

  test("honours q=0 as an explicit rejection", () => {
    assert.equal(negotiateMediaType("text/html;q=0, text/markdown"), "text/markdown");
    assert.equal(negotiateMediaType("text/markdown;q=0, text/html"), "text/html");
  });

  test("lets a specific range override a wildcard, per RFC 9110 §12.5.1", () => {
    // The wildcard must not resurrect a type the client explicitly rejected.
    assert.equal(negotiateMediaType("text/html;q=0, */*"), "text/markdown");
    assert.equal(negotiateMediaType("text/markdown;q=0, */*;q=1"), "text/html");
  });

  test("matches subtype wildcards", () => {
    assert.equal(negotiateMediaType("text/*"), "text/html");
    assert.equal(negotiateMediaType("text/html;q=0, text/*"), "text/markdown");
  });

  test("returns null only when nothing produced is acceptable", () => {
    assert.equal(negotiateMediaType("application/pdf"), null);
    assert.equal(negotiateMediaType("image/png, application/json"), null);
    assert.equal(negotiateMediaType("text/html;q=0, text/markdown;q=0"), null);
    assert.equal(negotiateMediaType("*/*;q=0"), null);
  });

  test("clamps out-of-range and unparseable q values", () => {
    assert.equal(negotiateMediaType("text/markdown;q=5, text/html;q=1"), "text/markdown");
    assert.equal(negotiateMediaType("application/pdf;q=nonsense"), null);
  });
});

describe("withVaryAccept", () => {
  test("adds Accept to an empty Vary", () => {
    assert.equal(withVaryAccept(null), "Accept");
    assert.equal(withVaryAccept(""), "Accept");
  });

  test("preserves the tokens already there", () => {
    assert.equal(
      withVaryAccept("rsc, next-router-state-tree"),
      "rsc, next-router-state-tree, Accept",
    );
  });

  test("does not duplicate Accept, whatever its casing", () => {
    assert.equal(withVaryAccept("Accept"), "Accept");
    assert.equal(withVaryAccept("accept, rsc"), "accept, rsc");
  });
});

describe("notAcceptableBody", () => {
  test("lists the available representations and echoes the request", () => {
    const body = notAcceptableBody("application/pdf");
    assert.ok(body.includes("- text/html"), 'should contain "- text/html"');
    assert.ok(body.includes("- text/markdown"), 'should contain "- text/markdown"');
    assert.ok(
      body.includes("You requested: application/pdf"),
      'should contain "You requested: application/pdf"',
    );
  });

  test("survives a missing Accept header", () => {
    assert.ok(
      notAcceptableBody(null).includes("(no Accept header)"),
      'should contain "(no Accept header)"',
    );
  });
});
