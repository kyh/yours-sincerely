import assert from "node:assert/strict";
import { test } from "node:test";

import { buildOrganization, buildSiteGraph, serializeJsonLd } from "./structured-data";

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
  assert.ok(JSON.stringify(org.contactPoint).includes("im.kaiyu@gmail.com"));
  assert.equal(org.address, undefined);
  assert.equal(org.telephone, undefined);
});

test("serialization cannot close the script tag", () => {
  const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("<"));
  assert.deepEqual(JSON.parse(out), { name: "</script><script>alert(1)</script>" });
});
