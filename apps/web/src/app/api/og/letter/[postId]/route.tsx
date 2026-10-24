import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { ORPCError } from "@orpc/server";

import { isLetterIndexable, letterExcerpt } from "@/lib/seo";
import { caller } from "@/orpc/server";

/** The light theme's tokens (`src/app/styles/themes.css`), as the card draws them. */
const THEME = {
  background: "hsl(45 60% 96%)",
  card: "hsl(34 10% 98%)",
  foreground: "hsl(60 6% 13%)",
  mutedForeground: "hsl(60 6% 37%)",
} as const;

const SIZE = { height: 630, width: 1200 } as const;

interface Params {
  params: Promise<{ postId: string }>;
}

const svgDataUrl = (svg: Buffer) => `data:image/svg+xml;base64,${svg.toString("base64")}`;

/** Paths from the app root, which is the working directory under `next start`
    and on Vercel. Each is a literal so file tracing ships exactly these files. */
const loadAssets = async () => {
  const [regular, italic, logo, lion] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/inter-regular.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/inter-italic.ttf")),
    readFile(path.join(process.cwd(), "public/logo.svg")),
    readFile(path.join(process.cwd(), "public/characters/lion.svg")),
  ]);
  return { italic, lion: svgDataUrl(lion), logo: svgDataUrl(logo), regular };
};

const FADED_TEXT = "The disappearing ink on this letter has faded.";
const MAX_CHARACTERS = 300;

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

const fontSizeFor = (length: number) => {
  if (length <= 90) {
    return 46;
  }
  if (length <= 180) {
    return 38;
  }
  return 32;
};

/** The share card for one letter: its words in the app's letter card, signed the
    way the page signs it. Nothing about the writer beyond that pen name. */
export const GET = async (_request: Request, { params }: Params) => {
  const { postId } = await params;
  const [letter, { italic, lion, logo, regular }] = await Promise.all([
    loadLetterText(postId),
    loadAssets(),
  ]);

  const text = letter ? cardText(letter.content) : FADED_TEXT;
  const signature = letter?.signature ?? "Anonymous";

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: THEME.background,
        color: THEME.foreground,
        display: "flex",
        fontFamily: "Inter",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      {/* oxlint-disable-next-line nextjs/no-img-element -- ImageResponse draws plain elements; next/image does not render there */}
      <img
        alt=""
        height={52}
        src={logo}
        style={{ left: 48, position: "absolute", top: 40 }}
        width={150}
      />
      <div
        style={{
          background: THEME.card,
          borderRadius: 20,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 36,
          maxHeight: 470,
          overflow: "hidden",
          padding: "44px 48px",
          position: "relative",
          transform: "rotate(-1.5deg)",
          width: 900,
        }}
      >
        <div
          style={{
            color: letter ? THEME.foreground : THEME.mutedForeground,
            display: "flex",
            fontSize: fontSizeFor(text.length),
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
        <div style={{ display: "flex", fontSize: 28, fontStyle: "italic", gap: 8 }}>
          <span>Yours Sincerely,</span>
          <span>{signature}</span>
        </div>
        {/* oxlint-disable-next-line nextjs/no-img-element -- ImageResponse draws plain elements; next/image does not render there */}
        <img
          alt=""
          height={170}
          src={lion}
          style={{
            bottom: -6,
            opacity: 0.3,
            position: "absolute",
            right: 16,
            transform: "scaleX(-1)",
          }}
          width={120}
        />
      </div>
    </div>,
    {
      ...SIZE,
      fonts: [
        { data: regular, name: "Inter", style: "normal", weight: 400 },
        { data: italic, name: "Inter", style: "italic", weight: 400 },
      ],
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
};
