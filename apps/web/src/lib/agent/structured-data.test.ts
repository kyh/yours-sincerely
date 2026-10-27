import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildLetterGraph,
  buildOrganization,
  buildSiteGraph,
  buildVideoObject,
  serializeJsonLd,
} from "./structured-data";

test("the graph names the organization, the site and the app", () => {
  const graph = JSON.stringify(buildSiteGraph()["@graph"]);
  for (const type of ["Organization", "WebSite", "WebApplication"]) {
    assert.ok(graph.includes(`"@type":"${type}"`), type);
  }
});

test("the organization carries identity and a contact point, but no invented address", () => {
  const org = buildOrganization();
  assert.equal(org.name, "Yours Sincerely");
  assert.equal(org.url, "https://yourssincerely.org");
  assert.ok(Array.isArray(org.sameAs) && org.sameAs.length > 0);
  assert.ok(JSON.stringify(org.contactPoint).includes("kai@kyh.io"));
  assert.equal(org.address, undefined);
  assert.equal(org.telephone, undefined);
});

test("serialization cannot close the script tag", () => {
  const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("<"));
  assert.deepEqual(JSON.parse(out), { name: "</script><script>alert(1)</script>" });
});

test("the site graph describes the og:video with absolute URLs and an ISO duration", () => {
  const video = buildVideoObject();
  assert.equal(video["@type"], "VideoObject");
  assert.equal(video.contentUrl, "https://yourssincerely.org/og/og.mp4");
  assert.equal(video.thumbnailUrl, "https://yourssincerely.org/og/og-poster.jpg");
  assert.match(String(video.duration), /^PT\d+S$/u);
  assert.match(String(video.uploadDate), /^\d{4}-\d{2}-\d{2}$/u);
  assert.ok(JSON.stringify(buildSiteGraph()).includes('"@type":"VideoObject"'));
});

test("a letter's graph names only the pen name the page prints", () => {
  const graph = buildLetterGraph(
    {
      commentCount: 2,
      content: "Thank you.",
      createdAt: "2026-10-20 09:30:00",
      createdBy: "Anonymous",
      id: "abc",
      likeCount: 5,
      parentId: "",
    },
    "https://yourssincerely.org/api/og/letter/abc",
  );
  const out = JSON.stringify(graph);
  assert.ok(out.includes('"@type":"SocialMediaPosting"'));
  assert.ok(out.includes('"@type":"BreadcrumbList"'));
  assert.ok(out.includes('"author":{"@type":"Person","name":"Anonymous"}'));
  assert.ok(!out.includes("/profile/"));
  assert.ok(!out.includes("parentItem"));
});
