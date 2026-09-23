import { z } from "zod";

import { ANONYMOUS_DISPLAY_NAME } from "./user.ts";

export const POST_EXPIRY_DAYS = 21;
const LEGACY_AVATAR_COUNT = 20;

/** Server timestamps come from Postgres `timestamp without time zone` columns
    (drizzle mode "string") as UTC wall time like "2026-07-09 18:23:45.123".
    They are zone-less, so `new Date()` would parse them as LOCAL time and skew
    all countdown/heatmap math by the viewer's UTC offset. */
const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/iu;

export const parseServerDate = (value: string): Date => {
  const iso = value.replace(" ", "T");
  // Date-only strings already parse as UTC; only zone-less date-times need Z.
  if (!iso.includes("T") || HAS_EXPLICIT_ZONE.test(iso)) {
    return new Date(iso);
  }
  return new Date(`${iso}Z`);
};

/** A server timestamp echoed back as input, as keyset cursors do. Postgres rejects
    anything else with a cast error, which would reach the client as a 500 instead
    of a 400. `z.iso.datetime` cannot express it: it demands the `T` that Postgres
    prints as a space. */
export const serverTimestamp = z
  .string()
  .regex(
    // Year 0000 and offsets past ±15:59 are also cast errors in Postgres.
    /^(?!0000)\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])[ T](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:0\d|1[0-5])(?::?[0-5]\d)?)?$/u,
    "Not a server timestamp",
  )
  // The pattern admits February 30th, which Postgres rejects and `Date` silently
  // rolls into March, so the calendar date has to survive a round trip.
  .refine((value) => {
    const day = value.slice(0, 10);
    const parsed = parseServerDate(day);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(day);
  }, "Not a calendar date");

export interface ExpiryProgress {
  start: Date;
  end: Date;
  /** 0–100, clamped. 100 means expired. */
  percentage: number;
  isExpired: boolean;
}

/** The one definition of how a letter fades. Both the web and native timer
    buttons render this — do not re-derive it per platform. */
export const getExpiryProgress = (createdAt: string, now: Date = new Date()): ExpiryProgress => {
  const start = parseServerDate(createdAt);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + POST_EXPIRY_DAYS);

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

  return { end, isExpired: now >= end, percentage, start };
};

/** Particle from→to color transitions for the like-button burst — shared so
    web and native celebrate identically. */
export const LIKE_BURST_COLOR_PAIRS = [
  { from: "#9EC9F5", id: "blue-mint-a", to: "#9ED8C6" },
  { from: "#91D3F7", id: "sky-mint-a", to: "#9AE4CF" },
  { from: "#DC93CF", id: "pink-gold", to: "#E3D36B" },
  { from: "#CF8EEF", id: "purple-lime-a", to: "#CBEB98" },
  { from: "#87E9C6", id: "green-emerald", to: "#1FCC93" },
  { from: "#A7ECD0", id: "mint-mint", to: "#9AE4CF" },
  { from: "#87E9C6", id: "green-purple-a", to: "#A635D9" },
  { from: "#D58EB3", id: "rose-lilac", to: "#E0B6F5" },
  { from: "#F48BA2", id: "coral-purple", to: "#CF8EEF" },
  { from: "#91D3F7", id: "sky-purple", to: "#A635D9" },
  { from: "#CF8EEF", id: "purple-lime-b", to: "#CBEB98" },
  { from: "#87E9C6", id: "green-purple-b", to: "#A635D9" },
  { from: "#9EC9F5", id: "blue-mint-b", to: "#9ED8C6" },
  { from: "#91D3F7", id: "sky-mint-b", to: "#9AE4CF" },
];

export const getLegacyAvatarIndex = (value = ANONYMOUS_DISPLAY_NAME) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    // oxlint-disable-next-line no-bitwise, unicorn/prefer-code-point -- the legacy hash; changing it reassigns every stored avatar
    hash = (hash << 5) - hash + value.charCodeAt(index);
    // oxlint-disable-next-line no-bitwise -- truncates to int32, part of the same hash
    hash &= hash;
  }
  return Math.abs(hash) % LEGACY_AVATAR_COUNT;
};

const CJK_CHARACTER = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/gu;

/** Platform-neutral reading time. CJK characters count as words, matching the prior web behavior. */
export const getReadingTime = (text: string) => {
  const cjkWords = text.match(CJK_CHARACTER)?.length ?? 0;
  const spacedWords = text.replace(CJK_CHARACTER, " ").trim().split(/\s+/u).filter(Boolean).length;
  const words = cjkWords + spacedWords;
  const minutes = words / 200;
  return { minutes, text: `${Math.ceil(minutes)} min read`, words };
};
