/** Ports of the motion/popmotion math helpers used by the web card stack
    (apps/web posts/_components/card-stack.tsx). Pure functions — safe in
    render code and worklets. */

export const mix = (from: number, to: number, t: number) => {
  "worklet";
  return from + (to - from) * t;
};

export const progress = (from: number, to: number, value: number) => {
  "worklet";
  const range = to - from;
  return range === 0 ? 1 : (value - from) / range;
};

export const wrap = (min: number, max: number, value: number) => {
  "worklet";
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

export const clamp01 = (value: number) => {
  "worklet";
  return Math.min(1, Math.max(0, value));
};

/** motion's easeIn approximation (quadratic). */
export const easeIn = (t: number) => {
  "worklet";
  return t * t;
};
