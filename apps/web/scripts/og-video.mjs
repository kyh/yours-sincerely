/**
 * Renders `public/og/og.mp4` (the og:video) and `public/og/og-poster.jpg`.
 *
 *   pnpm og:video
 *
 * A self-contained scene, never a route of the app: a letter in the app's own
 * card styling writes itself line by line, holds a beat, then its disappearing
 * ink fades out, and the loop starts again on the same empty card. Everything
 * it draws comes from the repo: the theme tokens in `src/app/styles/themes.css`,
 * the Inter files in `assets/fonts`, the logo and a character from `public/`.
 *
 * Each frame is set by hand and screenshotted, so the clip is deterministic and
 * its last frame leads straight back into its first. Needs Playwright with its
 * Chromium (resolved from this package or NODE_PATH; it is not a dependency)
 * and ffmpeg on PATH. Not part of `pnpm verify` or the build.
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;
const FPS = 30;
const SECONDS = 8;
const POSTER_AT = 4.6;

const webRoot = path.resolve(import.meta.dirname, "..");
const outDir = path.join(webRoot, "public", "og");

const LETTER = [
  "To the stranger who held the door this morning,",
  "you won't remember it, but I will.",
  "Thank you for the small kindness.",
  "I hope someone holds one open for you today.",
].join("\n");

const loadPlaywright = () => {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    throw new Error(
      "Playwright is not installed here. Run with NODE_PATH pointing at a global install, e.g. NODE_PATH=$(npm root -g) pnpm og:video",
    );
  }
};

/** The light theme's tokens, read from the stylesheet the app ships. */
const readThemeTokens = async () => {
  const css = await readFile(path.join(webRoot, "src/app/styles/themes.css"), "utf-8");
  const root = css.slice(css.indexOf(":root"), css.indexOf("}"));
  /** @param {string} name - a custom property of `:root`, without the dashes */
  const token = (name) => {
    const match = root.match(new RegExp(`--${name}:\\s*([^;]+);`, "u"));
    if (!match?.[1]) {
      throw new Error(`themes.css has no --${name} in :root`);
    }
    return match[1].trim();
  };
  return {
    background: token("background"),
    border: token("border"),
    card: token("card"),
    foreground: token("foreground"),
    mutedForeground: token("muted-foreground"),
    radius: token("radius"),
  };
};

/**
 * @param {string} file - a font file in `assets/fonts`
 * @param {"normal" | "italic"} style - its CSS font-style
 */
const fontFace = async (file, style) => {
  const data = await readFile(path.join(webRoot, "assets/fonts", file));
  return `@font-face{font-family:Inter;font-style:${style};font-weight:400;src:url(data:font/ttf;base64,${data.toString("base64")}) format("truetype");}`;
};

const buildScene = async () => {
  const theme = await readThemeTokens();
  const [regular, italic, logo, lion] = await Promise.all([
    fontFace("inter-regular.ttf", "normal"),
    fontFace("inter-italic.ttf", "italic"),
    readFile(path.join(webRoot, "public/logo.svg"), "utf-8"),
    readFile(path.join(webRoot, "public/characters/lion.svg")),
  ]);
  const lionUrl = `data:image/svg+xml;base64,${lion.toString("base64")}`;

  // Card, footer and type sizes are the app's own (p-5, gap-5, rounded-xl,
  // shadow-sm, text-sm italic signature), scaled up by `zoom` to read at OG size.
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${regular}${italic}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{background:${theme.background};color:${theme.foreground};font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;align-items:center;justify-content:center}
.logo{position:absolute;left:48px;top:40px;width:150px;color:${theme.foreground}}
.logo svg{width:100%;height:auto}
.tag{position:absolute;bottom:40px;width:100%;text-align:center;font-size:20px;color:${theme.mutedForeground}}
.stage{zoom:1.85;transform:rotate(-1.5deg)}
.card{position:relative;width:440px;background:${theme.card};border-radius:calc(${theme.radius} * 1.4);padding:20px;display:flex;flex-direction:column;gap:20px;overflow:hidden;box-shadow:0 1px 3px 0 rgb(0 0 0 / .1),0 1px 2px -1px rgb(0 0 0 / .1)}
.letter{white-space:pre-wrap;overflow-wrap:break-word;font-size:16px;line-height:24px;min-height:96px}
.ch{display:inline}
.caret{display:inline-block;width:0;position:relative}
.caret::after{content:"";position:absolute;left:1px;top:-17px;width:1.5px;height:20px;background:${theme.foreground}}
footer{display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;font-style:italic}
.lion{position:absolute;right:4px;bottom:-4px;width:70px;height:100px;opacity:.3;transform:scaleX(-1)}
</style></head><body>
<div class="logo">${logo.replaceAll('fill="#111827"', 'fill="currentColor"')}</div>
<div class="stage"><div class="card">
<p class="letter" id="letter"></p>
<footer><span>Yours Sincerely,</span><span>Anonymous</span></footer>
<div style="height:20px"></div>
<img class="lion" src="${lionUrl}" alt="">
</div></div>
<p class="tag">Anonymous love letters written in disappearing ink.</p>
<script>
const LETTER = ${JSON.stringify(LETTER)};
const chars = [...LETTER];
const el = document.getElementById("letter");
const spans = chars.map((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; return s; });
const caret = document.createElement("span"); caret.className = "caret";
// Typing time per character: line breaks and commas linger like a pen lifting.
const weights = chars.map((c) => (c === "\\n" ? 7 : c === "," || c === "." ? 3 : 1));
const total = weights.reduce((a, b) => a + b, 0);
const typedAt = []; let acc = 0; for (const w of weights) { acc += w; typedAt.push(acc / total); }
// A fixed scatter so each letter of ink fades at its own moment, the same every run.
let seed = 7; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const fadeAt = chars.map((_, i) => 0.55 * (i / chars.length) + 0.45 * rand());
const T = { typeStart: 0.5, typeEnd: 4.1, fadeStart: 5.2, fadeEnd: 7.4 };
const clamp = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => v * v * (3 - 2 * v);
window.setFrame = (t) => {
  el.replaceChildren();
  const typed = clamp((t - T.typeStart) / (T.typeEnd - T.typeStart));
  const fading = clamp((t - T.fadeStart) / (T.fadeEnd - T.fadeStart));
  let caretPlaced = false;
  spans.forEach((s, i) => {
    const shown = typed >= typedAt[i];
    // Each character fades over 30% of the fade window, from its own start.
    const ink = 1 - ease(clamp((fading - fadeAt[i] * 0.7) / 0.3));
    s.style.opacity = shown ? String(ink) : "0";
    s.style.filter = shown && ink < 1 ? "blur(" + ((1 - ink) * 2.5).toFixed(2) + "px)" : "none";
    el.append(s);
    if (!caretPlaced && !shown) { el.insertBefore(caret, s); caretPlaced = true; }
  });
  const writing = t < T.typeEnd + 0.3 && t >= 0;
  const blinkOn = Math.floor(t * 2.2) % 2 === 0;
  caret.style.visibility = writing && (typed > 0 && typed < 1 ? true : blinkOn) ? "visible" : "hidden";
  if (!caretPlaced) el.append(caret);
};
window.setFrame(0);
</script></body></html>`;
};

/**
 * @param {string} framesDir - where the numbered PNG frames are
 * @param {string} output - the MP4 to write
 */
const encode = (framesDir, output) => {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(FPS),
      "-i",
      path.join(framesDir, "frame-%04d.png"),
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-crf",
      "26",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      output,
    ],
    { stdio: "inherit" },
  );
};

/**
 * The scene's own hook, `window.setFrame`, draws the frame at `t` seconds.
 * @param {number} t - seconds into the loop
 */
const frameScript = (t) => `window.setFrame(${t})`;

const main = async () => {
  const { chromium } = loadPlaywright();
  const html = await buildScene();
  const framesDir = await mkdtemp(path.join(tmpdir(), "ys-og-frames-"));
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { height: HEIGHT, width: WIDTH } });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const frameCount = FPS * SECONDS;
    for (let frame = 0; frame < frameCount; frame += 1) {
      await page.evaluate(frameScript(frame / FPS));
      const name = `frame-${String(frame).padStart(4, "0")}.png`;
      await page.screenshot({ path: path.join(framesDir, name) });
    }

    await page.evaluate(frameScript(POSTER_AT));
    await page.screenshot({
      path: path.join(outDir, "og-poster.jpg"),
      quality: 88,
      type: "jpeg",
    });

    encode(framesDir, path.join(outDir, "og.mp4"));
  } finally {
    await browser.close();
    await rm(framesDir, { force: true, recursive: true });
  }

  process.stdout.write(`Wrote ${path.relative(webRoot, outDir)}/og.mp4 and og-poster.jpg\n`);
};

await main();
