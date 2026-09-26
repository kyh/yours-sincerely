import { getLegacyAvatarIndex } from "@repo/contracts/content";
import { ANONYMOUS_DISPLAY_NAME } from "@repo/contracts/user";

export const getAvatarUrl = (str = ANONYMOUS_DISPLAY_NAME) =>
  `/avatars/${getLegacyAvatarIndex(str)}.svg`;
