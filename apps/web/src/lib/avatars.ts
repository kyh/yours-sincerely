import { getLegacyAvatarIndex } from "@repo/contracts/content";

export const getAvatarUrl = (str = "Anonymous") => `/avatars/${getLegacyAvatarIndex(str)}.svg`;
