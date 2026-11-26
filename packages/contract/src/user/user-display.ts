export const ANONYMOUS_DISPLAY_NAME = "Anonymous";

/** `||`, not `??`: a cleared pen name arrives as `""`, and a blank name must read
    as Anonymous everywhere, or the same writer gets a different name and avatar
    per surface. */
export const resolveDisplayName = (name?: string | null) =>
  name === undefined || name === null || name === "" ? ANONYMOUS_DISPLAY_NAME : name;

const LEGACY_AVATAR_COUNT = 20;

const UINT32_RANGE = 2 ** 32;
const INT32_LIMIT = 2 ** 31;

const wrapToInt32 = (value: number) => {
  const unsigned = ((value % UINT32_RANGE) + UINT32_RANGE) % UINT32_RANGE;

  return unsigned >= INT32_LIMIT ? unsigned - UINT32_RANGE : unsigned;
};

export const getLegacyAvatarIndex = (value = ANONYMOUS_DISPLAY_NAME) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    // oxlint-disable-next-line unicorn/prefer-code-point -- the legacy hash runs over UTF-16 code units; codePointAt would reassign every avatar whose name has an emoji
    hash = wrapToInt32(hash * 31 + value.charCodeAt(index));
  }

  return Math.abs(hash) % LEGACY_AVATAR_COUNT;
};
