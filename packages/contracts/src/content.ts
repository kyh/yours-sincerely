export const POST_EXPIRY_DAYS = 21;
const LEGACY_AVATAR_COUNT = 20;

/** Server timestamps come from Postgres `timestamp without time zone` columns
    (drizzle mode "string") as UTC wall time like "2026-07-09 18:23:45.123".
    They are zone-less, so `new Date()` would parse them as LOCAL time and skew
    all countdown/heatmap math by the viewer's UTC offset. */
const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export const parseServerDate = (value: string): Date => {
  const iso = value.replace(" ", "T");
  // Date-only strings already parse as UTC; only zone-less date-times need Z.
  if (!iso.includes("T") || HAS_EXPLICIT_ZONE.test(iso)) return new Date(iso);
  return new Date(`${iso}Z`);
};

export type ExpiryProgress = {
  start: Date;
  end: Date;
  /** 0–100, clamped. 100 means expired. */
  percentage: number;
  isExpired: boolean;
};

/** The one definition of how a letter fades. Both the web and native timer
    buttons render this — do not re-derive it per platform. */
export const getExpiryProgress = (createdAt: string, now: Date = new Date()): ExpiryProgress => {
  const start = parseServerDate(createdAt);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + POST_EXPIRY_DAYS);

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

  return { start, end, percentage, isExpired: now >= end };
};

/** Particle from→to color transitions for the like-button burst — shared so
    web and native celebrate identically. */
export const LIKE_BURST_COLOR_PAIRS = [
  { id: "blue-mint-a", from: "#9EC9F5", to: "#9ED8C6" },
  { id: "sky-mint-a", from: "#91D3F7", to: "#9AE4CF" },
  { id: "pink-gold", from: "#DC93CF", to: "#E3D36B" },
  { id: "purple-lime-a", from: "#CF8EEF", to: "#CBEB98" },
  { id: "green-emerald", from: "#87E9C6", to: "#1FCC93" },
  { id: "mint-mint", from: "#A7ECD0", to: "#9AE4CF" },
  { id: "green-purple-a", from: "#87E9C6", to: "#A635D9" },
  { id: "rose-lilac", from: "#D58EB3", to: "#E0B6F5" },
  { id: "coral-purple", from: "#F48BA2", to: "#CF8EEF" },
  { id: "sky-purple", from: "#91D3F7", to: "#A635D9" },
  { id: "purple-lime-b", from: "#CF8EEF", to: "#CBEB98" },
  { id: "green-purple-b", from: "#87E9C6", to: "#A635D9" },
  { id: "blue-mint-b", from: "#9EC9F5", to: "#9ED8C6" },
  { id: "sky-mint-b", from: "#91D3F7", to: "#9AE4CF" },
];

export const getLegacyAvatarIndex = (value = "Anonymous") => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash &= hash;
  }
  return Math.abs(hash) % LEGACY_AVATAR_COUNT;
};

const CJK_CHARACTER = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/gu;

/** Platform-neutral reading time. CJK characters count as words, matching the prior web behavior. */
export const getReadingTime = (text: string) => {
  const cjkWords = text.match(CJK_CHARACTER)?.length ?? 0;
  const spacedWords = text.replace(CJK_CHARACTER, " ").trim().split(/\s+/).filter(Boolean).length;
  const words = cjkWords + spacedWords;
  const minutes = words / 200;
  return { minutes, words, text: `${Math.ceil(minutes)} min read` };
};
