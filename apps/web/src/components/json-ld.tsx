import { serializeJsonLd } from "@/lib/agent/structured-data";

import type { JsonLdNode } from "@/lib/agent/structured-data";

export const JsonLd = ({ node }: { node: JsonLdNode }) => (
  // oxlint-disable-next-line react/no-danger -- the only way to emit a JSON-LD body; serializeJsonLd escapes `<`
  <script dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }} type="application/ld+json" />
);
