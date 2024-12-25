"use client";

import type { AnimationControls, Variants } from "motion/react";
import { motion } from "motion/react";

const svgVariants: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: [0, -10, 10, -10, 0] },
};

type IconProps = {
  className?: string;
  controls?: AnimationControls;
};

const BellIcon = ({ controls, ...props }: IconProps) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={svgVariants}
      animate={controls}
      transition={{
        duration: 0.5,
        ease: "easeInOut",
      }}
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </motion.svg>
  );
};

export { BellIcon };
