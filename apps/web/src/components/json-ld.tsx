import { serializeJsonLd } from "@/lib/agent/structured-data";

import type { JsonLdNode } from "@/lib/agent/structured-data";

export const JsonLd = ({ node }: { node: JsonLdNode }) => (
  <script type="application/ld+json">{serializeJsonLd(node)}</script>
);
