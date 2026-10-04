import { getLegacyAvatarIndex } from "@repo/contract/content";
import { ANONYMOUS_DISPLAY_NAME } from "@repo/contract/user";

export const getAvatarUrl = (str = ANONYMOUS_DISPLAY_NAME) =>
  `/avatars/${getLegacyAvatarIndex(str)}.svg`;
