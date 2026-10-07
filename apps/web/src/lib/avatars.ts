import { ANONYMOUS_DISPLAY_NAME, getLegacyAvatarIndex } from "@repo/contract/content";

export const getAvatarUrl = (str = ANONYMOUS_DISPLAY_NAME) =>
  `/avatars/${getLegacyAvatarIndex(str)}.svg`;
