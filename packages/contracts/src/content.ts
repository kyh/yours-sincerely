export const POST_EXPIRY_DAYS = 21;
const LEGACY_AVATAR_COUNT = 20;

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
