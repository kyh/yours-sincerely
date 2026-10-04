import { ORPCError } from "@orpc/server";
import { FEED_PAGE_SIZE } from "@repo/contract/post";

import { MARKDOWN_CONTENT_TYPE } from "@/lib/agent/accept";
import {
  renderAboutMarkdown,
  renderHomeMarkdown,
  renderLetterMarkdown,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "@/lib/agent/markdown";
import { resolveMarkdownRoute } from "@/lib/agent/markdown-routes";
import { contactPage, privacyPage, termsPage } from "@/lib/agent/site-pages";
import { caller } from "@/orpc/server";

interface MarkdownParams {
  params: Promise<{ slug?: string[] }>;
}

interface MarkdownResult {
  body: string;
  status: 200 | 404;
}

const found = (body: string): MarkdownResult => ({ body, status: 200 });

const notFound = (pathname: string): MarkdownResult => ({
  body: renderNotFoundMarkdown(pathname),
  status: 404,
});

const letterMarkdown = async (pathname: string, postId: string): Promise<MarkdownResult> => {
  try {
    const { post } = await caller.post.getPost({ postId });
    return found(renderLetterMarkdown(post, post.comments ?? []));
  } catch (error) {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") {
      return notFound(pathname);
    }
    throw error;
  }
};

const buildMarkdown = async (pathname: string): Promise<MarkdownResult> => {
  const route = resolveMarkdownRoute(pathname);

  switch (route.kind) {
    case "home": {
      const { posts } = await caller.post.getFeed({ limit: FEED_PAGE_SIZE });
      return found(renderHomeMarkdown(posts));
    }
    case "about": {
      return found(renderAboutMarkdown());
    }
    case "contact": {
      return found(renderProsePageMarkdown(contactPage));
    }
    case "privacy": {
      return found(renderProsePageMarkdown(privacyPage));
    }
    case "terms": {
      return found(renderProsePageMarkdown(termsPage));
    }
    case "letter": {
      return letterMarkdown(pathname, route.postId);
    }
    default: {
      return notFound(pathname);
    }
  }
};

/**
 * The Markdown half of content negotiation. `src/proxy.ts` rewrites here when a
 * client prefers `text/markdown`; nothing links to `/api/markdown/*` directly.
 */
export const GET = async (_request: Request, { params }: MarkdownParams) => {
  const { slug = [] } = await params;
  const { body, status } = await buildMarkdown(`/${slug.join("/")}`);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      Vary: "Accept",
    },
    status,
  });
};
