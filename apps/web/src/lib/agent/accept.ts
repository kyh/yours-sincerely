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
  /** Lowercased media range, e.g. `text/markdown`, `text/*`, or the full wildcard. */
  range: string;
  /** Quality factor, clamped to [0, 1]. `0` is an explicit rejection. */
  quality: number;
  /** Full wildcard = 0, `type/*` = 1, `type/subtype` = 2. Higher wins regardless of q. */
  specificity: number;
  /** Position in the client's header, used to break ties. */
  position: number;
}

const parseQuality = (parameters: string[]): number => {
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

const specificityOf = (range: string): number => {
  if (range === "*/*") {
    return 0;
  }
  if (range.endsWith("/*")) {
    return 1;
  }
  return 2;
};

export const parseAcceptHeader = (header: string): AcceptEntry[] =>
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

const rangeMatches = (range: string, candidate: string): boolean => {
  if (range === "*/*") {
    return true;
  }
  if (range.endsWith("/*")) {
    return candidate.startsWith(range.slice(0, -1));
  }
  return range === candidate;
};

/**
 * The most specific range matching `candidate`; ties break on the client's own
 * ordering. Specificity outranks quality so a full wildcard after `text/html;q=0` still rejects
 * HTML instead of letting the wildcard resurrect it.
 */
const bestMatchFor = (entries: AcceptEntry[], candidate: string): AcceptEntry | null => {
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
 * Picks the representation to serve, or `null` when the client accepts nothing
 * this site produces — the one case that warrants a 406. A missing, empty or
 * unparseable header means "no constraint", not "nothing works", so it falls
 * back to HTML rather than erroring.
 */
export const negotiateMediaType = (header: string | null): ProducedMediaType | null => {
  if (!header?.trim()) {
    return "text/html";
  }

  const entries = parseAcceptHeader(header);
  if (entries.length === 0) {
    return "text/html";
  }

  let chosen: ProducedMediaType | null = null;
  let chosenQuality = -1;
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
export const withVaryAccept = (existing: string | null): string => {
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

/** Body for a 406, per RFC 9110's recommendation to list what is available. */
export const notAcceptableBody = (requested: string | null): string =>
  [
    "This resource is available in:",
    ...PRODUCED_MEDIA_TYPES.map((type) => `- ${type}`),
    "",
    `You requested: ${requested ?? "(no Accept header)"}`,
    "",
  ].join("\n");
