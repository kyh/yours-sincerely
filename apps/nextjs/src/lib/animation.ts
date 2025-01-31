import { useAnimation } from "motion/react";

export const useIconAnimation = () => {
  const controls = useAnimation();

  const onMouseEnter = () => controls.start("animate");
  const onMouseLeave = () => controls.start("normal");
  const onTouchStart = () => controls.start("animate");

  return { controls, onMouseEnter, onMouseLeave, onTouchStart };
};
