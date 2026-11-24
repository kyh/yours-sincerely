import assert from "node:assert/strict";
import test from "node:test";

import { WEB_HOST } from "./mobile-identity.ts";
import { reportPostMailto, SITE, supportMailto, WEB_ORIGIN } from "./site.ts";

test("mailto links carry no raw spaces", () => {
  for (const href of [supportMailto("a-user"), supportMailto(), reportPostMailto("a-post")]) {
    assert.ok(href.startsWith(`mailto:${SITE.supportEmail}?subject=`), href);
    assert.doesNotMatch(href, /\s/u);
  }
});

const subjectOf = (href: string) => new URL(href).searchParams.get("subject");

test("mailto subjects decode to the text support reads", () => {
  assert.equal(subjectOf(supportMailto("a-user")), "Support: a-user");
  assert.equal(subjectOf(supportMailto(null)), "Support: anonymous");
  assert.equal(subjectOf(reportPostMailto("a-post")), "Report YS Post: a-post");
});

test("the web origin is the https origin of the shared host", () => {
  assert.equal(new URL(WEB_ORIGIN).origin, WEB_ORIGIN);
  assert.equal(new URL(WEB_ORIGIN).host, WEB_HOST);
});
