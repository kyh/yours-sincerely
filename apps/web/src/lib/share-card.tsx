import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { SHARE_CARD_SIZE } from "@/lib/seo";

/** The light theme's tokens (`src/app/styles/themes.css`), as the card draws them. */
const THEME = {
  background: "hsl(45 60% 96%)",
  card: "hsl(34 10% 98%)",
  foreground: "hsl(60 6% 13%)",
  mutedForeground: "hsl(60 6% 37%)",
} as const;

const svgDataUrl = (svg: Buffer) => `data:image/svg+xml;base64,${svg.toString("base64")}`;

/** Paths from the app root, which is the working directory under `next build`,
    `next start` and on Vercel. Each is a literal so file tracing ships exactly
    these files. */
const loadAssets = async () => {
  const [regular, italic, logo, lion] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/inter-regular.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/inter-italic.ttf")),
    readFile(path.join(process.cwd(), "public/logo.svg")),
    readFile(path.join(process.cwd(), "public/characters/lion.svg")),
  ]);
  return { italic, lion: svgDataUrl(lion), logo: svgDataUrl(logo), regular };
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

export interface ShareCard {
  /** A small line above the body, such as a page's name. */
  heading?: string;
  /** The words on the card. */
  text: string;
  /** Who signs it: "Yours Sincerely, <signature>". */
  signature: string;
  /** Muted ink, for a card that stands in for words it no longer shows. */
  muted?: boolean;
  /** Seconds a CDN may keep it. */
  maxAge: number;
}

/** Every share card the site draws: the app's letter card on its paper, in
    Inter, with the logo and the lion, so a letter and a page look alike. */
export const renderShareCard = async (card: ShareCard): Promise<ImageResponse> => {
  const { italic, lion, logo, regular } = await loadAssets();

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
        {card.heading ? (
          <div
            style={{
              color: THEME.mutedForeground,
              display: "flex",
              fontSize: 24,
              letterSpacing: 2,
              marginBottom: -16,
              textTransform: "uppercase",
            }}
          >
            {card.heading}
          </div>
        ) : null}
        <div
          style={{
            color: card.muted ? THEME.mutedForeground : THEME.foreground,
            display: "flex",
            fontSize: fontSizeFor(card.text.length),
            lineHeight: 1.45,
            // Clear of the lion in the corner.
            paddingRight: 96,
            whiteSpace: "pre-wrap",
          }}
        >
          {card.text}
        </div>
        <div style={{ display: "flex", fontSize: 28, fontStyle: "italic", gap: 8 }}>
          <span>Yours Sincerely,</span>
          <span>{card.signature}</span>
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
      ...SHARE_CARD_SIZE,
      fonts: [
        { data: regular, name: "Inter", style: "normal", weight: 400 },
        { data: italic, name: "Inter", style: "italic", weight: 400 },
      ],
      headers: { "Cache-Control": `public, max-age=${card.maxAge}, s-maxage=${card.maxAge}` },
    },
  );
};
