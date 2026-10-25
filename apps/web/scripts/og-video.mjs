/**
 * Renders `public/og/og.mp4` (the og:video) and `public/og/og-poster.jpg`.
 *
 *   pnpm og:video
 *
 * A self-contained scene, never a route of the app, in seven seconds: beside
 * the logo icon and its tagline, a letter card springs onto the page, the
 * letter writes itself at a typist's uneven pace, the signature runs in under
 * it, the card's own buttons pop up and its heart is liked, then the
 * disappearing ink lifts off word by word while the expiry ring runs out, and
 * the empty card floats away, leaving the frame the loop starts on. Everything
 * it draws comes from the repo: the theme tokens in `src/app/styles/themes.css`,
 * the Inter files in `assets/fonts`, the icon of `public/logo.svg`, a character
 * from `public/characters`, the post card's buttons and its like burst colours.
 *
 * Each frame is set by hand on a stepped clock and screenshotted at twice the
 * size, so the clip is deterministic and its last frame leads straight back
 * into its first. Needs Playwright with its Chromium (resolved from this
 * package or NODE_PATH; it is not a dependency) and ffmpeg on PATH. Not part
 * of `pnpm verify` or the build.
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;
const FPS = 30;
/** Keep in step with `OG_VIDEO.durationSeconds` in `src/lib/seo.ts`. */
const SECONDS = 7;
/** Written, signed and liked: the frame a share shows before it plays. */
const POSTER_AT = 4.12;

const webRoot = path.resolve(import.meta.dirname, "..");
const outDir = path.join(webRoot, "public", "og");

const LETTER = [
  "To the stranger who held the door:",
  "you won't remember it, but I will.",
  "I hope someone holds one for you.",
].join("\n");
const TAGLINE = "Anonymous love letters written in disappearing ink.";

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
    card: token("card"),
    foreground: token("foreground"),
    lightPurple: token("theme-light-purple"),
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

/** The logo's mark alone: its first path, the cat in a speech bubble. */
const readLogoIcon = async () => {
  const svg = await readFile(path.join(webRoot, "public/logo.svg"), "utf-8");
  const mark = svg.match(/<path[^>]*\sd="(?<d>[^"]+)"/u)?.groups?.d;
  if (!mark) {
    throw new Error("public/logo.svg has no path for its icon");
  }
  return `<svg viewBox="-2 -2 286 274" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="${mark}"/></svg>`;
};

/** The like burst's colour pairs, read from the rule the app's button uses. */
const readBurstColors = async () => {
  const source = await readFile(
    path.join(webRoot, "../../packages/contract/src/content.ts"),
    "utf-8",
  );
  const block = source.slice(source.indexOf("LIKE_BURST_COLOR_PAIRS"));
  const pairs = [
    ...block
      .slice(0, block.indexOf("]"))
      .matchAll(/from: "(?<from>#[0-9A-Fa-f]{6})".*?to: "(?<to>#[0-9A-Fa-f]{6})"/gu),
  ].map(({ groups }) => [groups?.from, groups?.to]);
  if (pairs.length === 0) {
    throw new Error("packages/contract/src/content.ts has no LIKE_BURST_COLOR_PAIRS");
  }
  return pairs;
};

// The post card's own icons (lucide's message-circle and share, the like heart).
const COMMENT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>`;
const SHARE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>`;
const HEART_PATH =
  "m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z";

const buildScene = async () => {
  const theme = await readThemeTokens();
  const [regular, italic, icon, lion, burst] = await Promise.all([
    fontFace("inter-regular.ttf", "normal"),
    fontFace("inter-italic.ttf", "italic"),
    readLogoIcon(),
    readFile(path.join(webRoot, "public/characters/lion.svg")),
    readBurstColors(),
  ]);
  const lionUrl = `data:image/svg+xml;base64,${lion.toString("base64")}`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${regular}${italic}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{position:relative;background:${theme.background};color:${theme.foreground};font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.glow{position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(closest-side,${theme.lightPurple},transparent);opacity:.32;left:520px;top:-60px}
.brand{position:absolute;left:72px;top:0;bottom:0;width:300px;display:flex;flex-direction:column;justify-content:center;gap:26px}
.icon{width:132px;color:${theme.foreground};transform-origin:50% 60%}
.icon svg{display:block;width:100%;height:auto}
.tag{font-size:27px;line-height:36px;text-wrap:balance;color:${theme.mutedForeground};letter-spacing:-.01em}
.card{position:absolute;left:428px;top:158px;width:712px;background:${theme.card};border-radius:calc(${theme.radius} * 2);padding:38px 40px 30px;overflow:hidden;will-change:transform}
.letter{position:relative;white-space:pre;font-size:32px;line-height:48px;letter-spacing:-.008em;height:144px}
.ch{display:inline-block;white-space:pre}
.caret{position:absolute;width:2.5px;height:36px;background:${theme.foreground};border-radius:1px}
footer{position:relative;display:flex;align-items:center;justify-content:space-between;margin-top:40px;height:44px}
.sig{font-size:23px;font-style:italic;white-space:pre}
.sig span{display:inline-block}
.actions{display:flex;align-items:center;gap:22px;color:${theme.mutedForeground};font-size:21px}
.act{display:flex;align-items:center;gap:8px;transform-origin:50% 50%}
.act svg{width:24px;height:24px;display:block}
.heart{position:relative;width:24px;height:24px}
.heart svg{position:absolute;inset:0;overflow:visible}
.ring{position:absolute;left:-18px;top:-18px;width:60px;height:60px;overflow:visible}
.particle{position:absolute;left:9px;top:9px;width:7px;height:7px;border-radius:50%}
.count{position:relative;display:inline-block;height:26px;min-width:24px;overflow:hidden;font-variant-numeric:tabular-nums}
.count span{position:absolute;left:0;top:0;line-height:26px}
.timer{width:24px;height:24px;border-radius:50%}
.lion{position:absolute;right:30px;top:34px;width:84px;height:120px;transform:scaleX(-1)}
</style></head><body>
<div class="glow" id="glow"></div>
<div class="brand">
  <div class="icon" id="icon">${icon}</div>
  <p class="tag">${TAGLINE}</p>
</div>
<div class="card" id="card">
  <img class="lion" id="lion" src="${lionUrl}" alt="">
  <p class="letter" id="letter"></p>
  <footer>
    <div class="sig" id="sig"></div>
    <div class="actions">
      <div class="act" id="a0">${COMMENT_ICON}<span>3</span></div>
      <div class="act" id="a1"><div class="heart" id="heart"></div><span class="count" id="count"></span></div>
      <div class="act" id="a2"><span class="timer" id="timer"></span></div>
      <div class="act" id="a3">${SHARE_ICON}</div>
    </div>
  </footer>
</div>
<script>
const LETTER = ${JSON.stringify(LETTER)};
const SIGNATURE = "Yours Sincerely, Anonymous";
const BURST = ${JSON.stringify(burst)};
const HEART = ${JSON.stringify(HEART_PATH)};
const LOOP = ${SECONDS};

// A fixed scatter, so every run draws the same clip.
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const span = (t, a, b) => clamp((t - a) / (b - a));
const mix = (a, b, v) => a + (b - a) * v;
const easeOut = (v) => 1 - (1 - v) ** 3;
const easeIn = (v) => v ** 2.2;
const easeInOut = (v) => (v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2);
/** A damped spring from 0 to 1, \`t\` seconds after release. */
const spring = (t, omega = 15, zeta = 0.55) => {
  if (t <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
};

const T = {
  enter: 0, write: 0.42, writeEnd: 2.62, sign: 2.5, signEnd: 3.0, lion: 2.75,
  pop: 2.9, like: 3.2, fade: 4.15, fadeEnd: 5.75, exit: 5.98, exitEnd: 6.85,
};

// --- the letter, one span per character ---------------------------------
const letterEl = document.getElementById("letter");
const caret = document.createElement("span");
caret.className = "caret";
const chars = [...LETTER];
const glyphs = [];
const lineOf = [];
let line = 0;
for (const c of chars) {
  if (c === "\\n") { letterEl.append(document.createElement("br")); line += 1; glyphs.push(null); lineOf.push(line); continue; }
  const s = document.createElement("span");
  s.className = "ch";
  s.textContent = c;
  letterEl.append(s);
  glyphs.push(s);
  lineOf.push(line);
}
letterEl.append(caret);

// Writing rhythm: quick runs inside a word, a breath at each space, a longer
// lift at punctuation and line ends, the odd hesitation before a word.
const gaps = chars.map((c, i) => {
  let g = 0.6 + rand() * 0.8;
  if (c === " ") g += 1.4 + rand() * 1.2;
  if (chars[i - 1] === " " && rand() < 0.25) g += 2.5;
  if (",:".includes(chars[i - 1] ?? "")) g += 4;
  if (".".includes(chars[i - 1] ?? "")) g += 5;
  if (c === "\\n") g += 5;
  return g;
});
const gapTotal = gaps.reduce((a, b) => a + b, 0);
const writeAt = [];
{ let acc = 0; for (const g of gaps) { acc += g; writeAt.push(T.write + (acc / gapTotal) * (T.writeEnd - T.write)); } }

// Ink lifting: word by word along the page, each word a little off the beat,
// each of its letters a hair after the last, drifting up as it goes.
const wordOf = [];
{ let w = 0; chars.forEach((c, i) => { if (c === " " || c === "\\n") { w += 1; } wordOf.push(w); }); }
const words = wordOf[wordOf.length - 1] + 1;
const wordStart = Array.from({ length: words }, (_, w) => T.fade + (w / words) * 0.95 + rand() * 0.3);
const fadeAt = chars.map((_, i) => wordStart[wordOf[i]] + (i % 7) * 0.018 + rand() * 0.05);
const drift = chars.map(() => [(rand() - 0.5) * 7, 5 + rand() * 7, (rand() - 0.5) * 10]);

// --- the signature, revealed like a pen run ------------------------------
const sigEl = document.getElementById("sig");
const sigGlyphs = [...SIGNATURE].map((c) => { const s = document.createElement("span"); s.textContent = c; sigEl.append(s); return s; });
const sigFadeAt = sigGlyphs.map((_, i) => 5.05 + (i / sigGlyphs.length) * 0.35 + rand() * 0.08);
const sigDrift = sigGlyphs.map(() => [(rand() - 0.5) * 6, 5 + rand() * 6]);

// --- the like button: the app's ring, burst and spring --------------------
const heartEl = document.getElementById("heart");
heartEl.innerHTML =
  '<svg class="ring" viewBox="0 0 60 60"><circle id="ringc" cx="30" cy="30" r="28" fill="none"/></svg>' +
  BURST.map((_, i) => '<i class="particle" id="p' + i + '"></i>').join("") +
  '<svg id="hOff" viewBox="0 0 24 24" fill="currentColor"><path d="' + HEART + '"/></svg>' +
  '<svg id="hOn" viewBox="0 0 24 24" fill="oklch(63.7% 0.237 25.331)"><path d="' + HEART + '"/></svg>';
const ringc = document.getElementById("ringc");
const hOff = document.getElementById("hOff");
const hOn = document.getElementById("hOn");
const particles = BURST.map((_, i) => document.getElementById("p" + i));
const burstSpread = BURST.map(() => 0.85 + rand() * 0.3);
const countEl = document.getElementById("count");
countEl.innerHTML = '<span id="c0">11</span><span id="c1">12</span>';
const c0 = document.getElementById("c0");
const c1 = document.getElementById("c1");
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const mixColor = (a, b, v) => { const x = hex(a), y = hex(b); return "rgb(" + x.map((n, k) => Math.round(mix(n, y[k], v))).join(",") + ")"; };

const card = document.getElementById("card");
const lion = document.getElementById("lion");
const timer = document.getElementById("timer");
const icon = document.getElementById("icon");
const glow = document.getElementById("glow");
const acts = [0, 1, 2, 3].map((i) => document.getElementById("a" + i));

window.setFrame = (t) => {
  const phase = (t / LOOP) * Math.PI * 2;
  // Ambient: the icon breathes and the glow wanders, both once per loop.
  icon.style.transform = "translateY(" + (Math.sin(phase) * -3).toFixed(2) + "px) scale(" + (1 + Math.sin(phase) * 0.018).toFixed(4) + ")";
  glow.style.transform = "translate(" + (Math.cos(phase) * 30).toFixed(1) + "px," + (Math.sin(phase) * 22).toFixed(1) + "px)";

  // The card: springs in, settles, then lifts away. Its shadow deepens with height.
  const enter = spring(t - T.enter, 13, 0.58);
  const leave = easeIn(span(t, T.exit, T.exitEnd));
  const y = mix(80, 0, enter) - leave * 46;
  const rot = mix(-6, -1.4, enter) + leave * 2.4;
  const scale = mix(0.96, 1, enter) + leave * 0.02;
  const lift = Math.abs(1 - enter) * 1.6 + leave * 1.8;
  card.style.opacity = String(clamp(t / 0.22) * (1 - easeOut(span(t, T.exit + 0.2, T.exitEnd))));
  card.style.transform = "translateY(" + y.toFixed(2) + "px) rotate(" + rot.toFixed(3) + "deg) scale(" + scale.toFixed(4) + ")";
  card.style.boxShadow =
    "0 " + (2 + lift * 10).toFixed(1) + "px " + (6 + lift * 26).toFixed(1) + "px rgb(40 34 20 / " + (0.08 + lift * 0.04).toFixed(3) + ")," +
    "0 " + (16 + lift * 18).toFixed(1) + "px " + (40 + lift * 30).toFixed(1) + "px -12px rgb(40 34 20 / " + (0.16 - lift * 0.03).toFixed(3) + ")";

  // Letters: ink settles in as each is written, lifts off as it disappears.
  let caretAt = null;
  chars.forEach((c, i) => {
    const g = glyphs[i];
    if (!g) return;
    const written = span(t, writeAt[i], writeAt[i] + 0.11);
    const gone = easeInOut(span(t, fadeAt[i], fadeAt[i] + 0.6));
    const [dx, dy, dr] = drift[i];
    g.style.opacity = (easeOut(written) * (1 - gone)).toFixed(3);
    const blur = (1 - easeOut(written)) * 1.6 + gone * 3.2;
    g.style.filter = blur > 0.02 ? "blur(" + blur.toFixed(2) + "px)" : "none";
    g.style.transform = "translate(" + (gone * dx).toFixed(2) + "px," + ((1 - easeOut(written)) * 3 - gone * dy).toFixed(2) + "px) rotate(" + (gone * dr).toFixed(2) + "deg)";
    if (t >= writeAt[i]) caretAt = g;
  });
  const writing = t >= T.write - 0.25 && t < T.writeEnd + 0.18;
  const blink = t < T.write || t > T.writeEnd ? Math.floor(t * 4) % 2 === 0 : true;
  caret.style.visibility = writing && blink ? "visible" : "hidden";
  const anchor = caretAt ?? glyphs[0];
  caret.style.left = (caretAt ? anchor.offsetLeft + anchor.offsetWidth + 1 : anchor.offsetLeft - 1) + "px";
  caret.style.top = anchor.offsetTop + 6 + "px";

  // Signature: each letter inks in left to right, then fades with the rest.
  sigGlyphs.forEach((g, i) => {
    const at = T.sign + (i / sigGlyphs.length) * (T.signEnd - T.sign);
    const inked = easeOut(span(t, at, at + 0.14));
    const gone = easeInOut(span(t, sigFadeAt[i], sigFadeAt[i] + 0.5));
    g.style.opacity = (inked * (1 - gone)).toFixed(3);
    g.style.transform = "translate(" + (gone * sigDrift[i][0]).toFixed(2) + "px," + ((1 - inked) * 3 - gone * sigDrift[i][1]).toFixed(2) + "px)";
    const blur = (1 - inked) * 1.4 + gone * 3;
    g.style.filter = blur > 0.02 ? "blur(" + blur.toFixed(2) + "px)" : "none";
  });

  // The lion peeks up behind the letter.
  const peek = spring(t - T.lion, 11, 0.62);
  lion.style.opacity = (0.3 * clamp((t - T.lion) / 0.2) * (1 - easeInOut(span(t, 5.25, 5.75)))).toFixed(3);
  lion.style.transform = "scaleX(-1) translateY(" + mix(26, 0, peek).toFixed(2) + "px)";

  // Buttons pop up one after another, and bow out once the letter is gone.
  acts.forEach((a, i) => {
    const s = spring(t - T.pop - i * 0.07, 18, 0.5);
    const out = easeInOut(span(t, 5.35 + i * 0.05, 5.7 + i * 0.05));
    a.style.opacity = (clamp((t - T.pop - i * 0.07) / 0.08) * (1 - out)).toFixed(3);
    a.style.transform = "scale(" + (Math.max(0, s) * (1 - out * 0.3)).toFixed(4) + ")";
  });

  // The like, timed as the app's: ring now, burst and heart 0.3s on.
  const lt = t - T.like;
  const ringV = easeOut(clamp(lt / 0.4));
  ringc.style.visibility = lt > 0 && lt < 0.4 ? "visible" : "hidden";
  ringc.setAttribute("r", String(28 * ringV));
  ringc.setAttribute("stroke-width", String(56 * (1 - ringV)));
  ringc.setAttribute("stroke", mixColor("#E5214A", "#CC8EF5", ringV));
  particles.forEach((p, i) => {
    const pt = clamp((lt - 0.3) / 0.6);
    const angle = ((i / BURST.length) * 360 + 45) * (Math.PI / 180);
    const r0 = 4 * 0.8;
    const r1 = 32 * burstSpread[i] * 0.8 * 1.5;
    const move = 1 - (1 - pt) ** 5;
    const shift = (13 * Math.PI) / 180;
    const x = mix(Math.cos(angle) * r0, Math.cos(angle + shift) * r1, move);
    const yy = mix(Math.sin(angle) * r0, Math.sin(angle + shift) * r1, move);
    p.style.opacity = lt > 0.3 && pt < 1 ? "1" : "0";
    p.style.background = mixColor(BURST[i][0], BURST[i][1], pt);
    p.style.transform = "translate(" + x.toFixed(2) + "px," + yy.toFixed(2) + "px) scale(" + (1 - pt ** 2).toFixed(3) + ")";
  });
  const liked = lt >= 0;
  hOff.style.visibility = liked ? "hidden" : "visible";
  hOn.style.visibility = liked ? "visible" : "hidden";
  hOn.style.transform = "scale(" + spring(lt - 0.3, 17.3, 0.29).toFixed(4) + ")";
  const roll = easeOut(span(t, T.like + 0.35, T.like + 0.6));
  c0.style.transform = "translateY(" + (-roll * 26).toFixed(2) + "px)";
  c1.style.transform = "translateY(" + ((1 - roll) * 26).toFixed(2) + "px)";
  c0.style.opacity = String(1 - roll);
  c1.style.opacity = String(roll);

  // The expiry ring runs out as the ink does, drawn as the app draws it.
  const pct = mix(28, 100, easeInOut(span(t, T.pop, T.fadeEnd)));
  timer.style.backgroundImage = "conic-gradient(rgba(120,120,120,.1) calc(3.6deg * " + pct.toFixed(2) + "), rgba(120,120,120,.5) calc(3.6deg * " + pct.toFixed(2) + "))";
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
      "-vf",
      `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-crf",
      "24",
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
    const page = await browser.newPage({
      deviceScaleFactor: SCALE,
      viewport: { height: HEIGHT, width: WIDTH },
    });
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
      scale: "css",
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
