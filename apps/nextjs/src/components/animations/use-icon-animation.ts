import { useRef } from "react";

type DotLottie = { play: () => void };

export const useIconAnimation = () => {
  const dotLottieRef = useRef<DotLottie>(null);

  const setDotLottie = (dotLottie: DotLottie) => {
    dotLottieRef.current = dotLottie;
  };

  const onMouseEnter = () => dotLottieRef.current?.play();
  const onTouchStart = () => dotLottieRef.current?.play();

  return { setDotLottie, onMouseEnter, onTouchStart };
};
