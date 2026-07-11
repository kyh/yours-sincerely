import { getLegacyAvatarIndex } from "@repo/contracts/content";

export const getAvatarUrl = (str = "Anonymous") => {
  return `/avatars/${getLegacyAvatarIndex(str)}.svg`;
};
