"use client";

import { domMax, LazyMotion, MotionConfig } from "motion/react";

// domMax, not domAnimation: the card stack's `drag` gesture is only included in
// domMax, and LazyMotion drops it silently — cards render fine but won't drag.
export const MotionProvider = ({ children }: { children: React.ReactNode }) => (
  <MotionConfig reducedMotion="user">
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  </MotionConfig>
);
