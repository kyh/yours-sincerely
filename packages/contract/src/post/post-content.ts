import { parseServerDate } from "../server-date.ts";

export const POST_EXPIRY_DAYS = 21;

export interface ExpiryProgress {
  start: Date;
  end: Date;
  /** 0–100, clamped. 100 means expired. */
  percentage: number;
  isExpired: boolean;
}

/** The one definition of how a letter fades. Both the web and native timer
    buttons render this — do not re-derive it per platform. */
export const getExpiryProgress: (createdAt: string, now?: Date) => ExpiryProgress = (
  createdAt,
  now = new Date(),
) => {
  const start = parseServerDate(createdAt);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + POST_EXPIRY_DAYS);

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

  return { end, isExpired: now >= end, percentage, start };
};

const CJK_CHARACTER = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/gu;

/** Platform-neutral reading time. CJK characters count as words, matching the prior web behavior. */
export const getReadingTime = (text: string) => {
  const cjkWords = text.match(CJK_CHARACTER)?.length ?? 0;

  const spacedWords = text
    .replaceAll(CJK_CHARACTER, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;

  const words = cjkWords + spacedWords;
  const minutes = words / 200;

  return { minutes, text: `${Math.ceil(minutes)} min read`, words };
};
