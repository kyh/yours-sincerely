export const ANONYMOUS_DISPLAY_NAME = "Anonymous";

/** `||`, not `??`: a cleared pen name arrives as `""`, and a blank name must read
    as Anonymous everywhere, or the same writer gets a different name and avatar
    per surface. */
export const resolveDisplayName = (name?: string | null) => name || ANONYMOUS_DISPLAY_NAME;

const LEGACY_AVATAR_COUNT = 20;

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
