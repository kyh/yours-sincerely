export const POST_EXPIRY_DAYS = 21;
export const LEGACY_AVATAR_COUNT = 20;

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
  const spacedWords = text
    .replace(CJK_CHARACTER, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const words = cjkWords + spacedWords;
  const minutes = words / 200;
  return { minutes, words, text: `${Math.ceil(minutes)} min read` };
};
