"use client";

import { domMax, LazyMotion, MotionConfig } from "motion/react";

// WARNING: domMax, not domAnimation: LazyMotion silently drops the card stack's drag gesture otherwise.
export const MotionProvider = ({ children }: { children: React.ReactNode }) => (
  <MotionConfig reducedMotion="user">
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  </MotionConfig>
);
