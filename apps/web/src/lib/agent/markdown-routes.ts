export type MarkdownRoute =
  | { kind: "home" }
  | { kind: "about" }
  | { kind: "contact" }
  | { kind: "privacy" }
  | { kind: "terms" }
  | { kind: "letter"; postId: string }
  /** A real page with no Markdown twin: it keeps serving HTML. */
  | { kind: "html-only" }
  | { kind: "not-found" };

const PAGE_KINDS = {
  "/about": "about",
  "/contact": "contact",
  "/privacy": "privacy",
  "/terms": "terms",
} as const;

/** Personal or form-driven screens: an agent gains nothing from Markdown there, and
    answering them 404 would tell it a live page does not exist. */
const HTML_ONLY_PREFIXES = ["/auth/", "/profile/", "/.well-known/"];
const HTML_ONLY_PATHS = new Set(["/notifications", "/settings"]);

const isPageKey = (path: string): path is keyof typeof PAGE_KINDS =>
  Object.hasOwn(PAGE_KINDS, path);

export const resolveMarkdownRoute = (pathname: string): MarkdownRoute => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname;

  if (path === "/" || path === "") {
    return { kind: "home" };
  }
  if (isPageKey(path)) {
    return { kind: PAGE_KINDS[path] };
  }

  const [, first, postId, ...rest] = path.split("/");
  if (first === "posts" && postId && rest.length === 0) {
    return { kind: "letter", postId };
  }

  if (HTML_ONLY_PATHS.has(path) || HTML_ONLY_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return { kind: "html-only" };
  }

  return { kind: "not-found" };
};
