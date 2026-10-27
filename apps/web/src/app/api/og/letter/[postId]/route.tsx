import { ORPCError } from "@orpc/server";

import { isLetterIndexable, letterExcerpt } from "@/lib/seo";
import { renderShareCard } from "@/lib/share-card";
import { caller } from "@/orpc/server";

interface Params {
  params: Promise<{ postId: string }>;
}

const FADED_TEXT = "The disappearing ink on this letter has faded.";
const MAX_CHARACTERS = 300;
const ONE_HOUR = 3600;

/** Short letters keep their own line breaks; long ones are cut at a word. */
const cardText = (content: string) =>
  content.length <= MAX_CHARACTERS ? content.trim() : letterExcerpt(content, MAX_CHARACTERS);

/** A deleted, hidden or faded letter gets a card with no words of its own. */
const loadLetterText = async (postId: string) => {
  try {
    const { post } = await caller.post.getPost({ postId });
    return isLetterIndexable(post) ? { content: post.content, signature: post.createdBy } : null;
  } catch (error) {
    if (error instanceof ORPCError) {
      return null;
    }
    throw error;
  }
};

/** The share card for one letter: its words in the app's letter card, signed the
    way the page signs it. Nothing about the writer beyond that pen name. */
export const GET = async (_request: Request, { params }: Params) => {
  const { postId } = await params;
  const letter = await loadLetterText(postId);

  return renderShareCard({
    maxAge: ONE_HOUR,
    muted: !letter,
    signature: letter?.signature ?? "Anonymous",
    text: letter ? cardText(letter.content) : FADED_TEXT,
  });
};
