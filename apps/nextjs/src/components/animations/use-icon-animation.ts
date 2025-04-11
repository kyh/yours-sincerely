import { useState } from "react";

import type { DotLottie } from "@lottiefiles/dotlottie-react";

export const useIconAnimation = () => {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);

  const onMouseEnter = () => dotLottie?.play();
  const onTouchStart = () => dotLottie?.play();

  return { setDotLottie, onMouseEnter, onTouchStart };
};
