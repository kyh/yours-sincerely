import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

/**
 * Editable text state seeded from a server value that arrives (and can change)
 * after the first render.
 *
 * Re-seeding happens during render rather than in an effect: an effect would
 * paint the stale value first, then immediately re-render with the fresh one.
 * A nullish seed means "nothing to seed with yet", so whatever the user has
 * typed survives.
 */
export const useSeededState = (
  seed: string | null | undefined,
  fallback: string,
): [string, Dispatch<SetStateAction<string>>] => {
  const [value, setValue] = useState(seed ?? fallback);
  const [seenSeed, setSeenSeed] = useState(seed);

  if (seed !== seenSeed) {
    setSeenSeed(seed);
    if (seed !== null && seed !== undefined) setValue(seed);
  }

  return [value, setValue];
};
