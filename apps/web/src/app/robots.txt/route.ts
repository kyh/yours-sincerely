import { siteConfig } from "@/lib/site-config";

// A route rather than the metadata `robots.ts`, which cannot emit Content-Signal.
// The same robots.txt on every site. https://contentsignals.org/
export const GET = () => {
  const body = `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
