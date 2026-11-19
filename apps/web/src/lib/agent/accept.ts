/**
 * RFC 9110 §12.5.1 Accept negotiation, narrowed to the two representations this
 * site produces. Implements the acceptmarkdown.com contract:
 * <https://acceptmarkdown.com/recipes/nextjs>
 *
 * Pure and framework-free on purpose — `src/proxy.ts` is the only caller, and
 * proxy code cannot be exercised in a unit test.
 */

export const PRODUCED_MEDIA_TYPES = ["text/html", "text/markdown"] as const;

export type ProducedMediaType = (typeof PRODUCED_MEDIA_TYPES)[number];

export const HTML_CONTENT_TYPE = "text/html; charset=utf-8";
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

interface AcceptEntry {
  range: string;
  quality: number;
  specificity: number;
  position: number;
}

const parseQuality = (parameters: string[]) => {
  for (const parameter of parameters) {
    const [name, value] = parameter.split("=").map((part) => part.trim());

    if (name?.toLowerCase() !== "q") {
      continue;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      continue;
    }

    return Math.max(0, Math.min(1, parsed));
  }

  return 1;
};

const specificityOf = (range: string) => {
  if (range === "*/*") {
    return 0;
  }

  if (range.endsWith("/*")) {
    return 1;
  }

  return 2;
};

export const parseAcceptHeader = (header: string) =>
  header
    .split(",")
    .map((raw, position) => {
      const parts = raw
        .trim()
        .split(";")
        .map((part) => part.trim());

      const range = (parts[0] ?? "").toLowerCase();

      return {
        position,
        quality: parseQuality(parts.slice(1)),
        range,
        specificity: specificityOf(range),
      };
    })
    .filter((entry) => entry.range.includes("/"));

const rangeMatches = (range: string, candidate: string) => {
  if (range === "*/*") {
    return true;
  }

  if (range.endsWith("/*")) {
    return candidate.startsWith(range.slice(0, -1));
  }

  return range === candidate;
};

const bestMatchFor = (entries: AcceptEntry[], candidate: string) => {
  let best: AcceptEntry | null = null;

  for (const entry of entries) {
    if (!rangeMatches(entry.range, candidate)) {
      continue;
    }

    if (
      best === null ||
      entry.specificity > best.specificity ||
      (entry.specificity === best.specificity && entry.position < best.position)
    ) {
      best = entry;
    }
  }

  return best;
};

/**
 * Picks the representation to serve. HTML is the fallback whenever the client
 * accepts nothing this site produces: a 406 would break clients that sent a
 * sloppy header and got a page before Markdown negotiation existed. A missing,
 * empty or unparseable header likewise means "no constraint".
 */
export const negotiateMediaType: (header: string | null) => ProducedMediaType = (header) => {
  if (!header?.trim()) {
    return "text/html";
  }

  const entries = parseAcceptHeader(header);

  if (entries.length === 0) {
    return "text/html";
  }

  let chosen: ProducedMediaType = "text/html";
  let chosenQuality = 0;
  let chosenPosition = Number.POSITIVE_INFINITY;

  for (const candidate of PRODUCED_MEDIA_TYPES) {
    const match = bestMatchFor(entries, candidate);

    if (match === null || match.quality <= 0) {
      continue;
    }

    if (
      match.quality > chosenQuality ||
      (match.quality === chosenQuality && match.position < chosenPosition)
    ) {
      chosen = candidate;
      chosenQuality = match.quality;
      chosenPosition = match.position;
    }
  }

  return chosen;
};

/**
 * Adds `Accept` to an existing `Vary` without clobbering it. Next.js already
 * varies on its RSC headers, so a plain `set` would drop them and let a CDN
 * hand a flight payload to a document request.
 */
export const withVaryAccept = (existing: string | null) => {
  if (!existing?.trim()) {
    return "Accept";
  }

  const tokens = existing
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.some((token) => token.toLowerCase() === "accept")) {
    return tokens.join(", ");
  }

  return [...tokens, "Accept"].join(", ");
};
