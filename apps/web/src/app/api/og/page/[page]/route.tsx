import { PAGE_CARDS, isPageCardKey } from "@/lib/seo";
import { renderShareCard } from "@/lib/share-card";

interface Params {
  params: Promise<{ page: string }>;
}

const ONE_DAY = 86_400;

// Drawn once at build: a standing page's card changes only with a deploy.
export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () => Object.keys(PAGE_CARDS).map((page) => ({ page }));

/** A standing page's share card: its description in the letter card, signed as
    every letter on the site is. */
export const GET = async (_request: Request, { params }: Params) => {
  const { page } = await params;
  if (!isPageCardKey(page)) {
    return new Response("Not found", { status: 404 });
  }
  const card = PAGE_CARDS[page];
  return renderShareCard({
    heading: card.title,
    maxAge: ONE_DAY,
    signature: "Anonymous",
    text: card.description,
  });
};
