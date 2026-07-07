/** Minimal RN-safe replacement for the `reading-time` package
    (its entry point requires Node's `stream`). Same 200 wpm default. */
export const readingTime = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words / 200;
  const displayed = Math.ceil(minutes);
  return {
    minutes,
    words,
    text: `${displayed} min read`,
  };
};
