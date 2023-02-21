import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: React.ReactNode;
  selector?: string;
};

export const Portal = ({ children, selector }: Props) => {
  const ref = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ref.current = selector ? document.querySelector(selector) : document.body;
    setMounted(true);
  }, [selector]);

  return mounted ? createPortal(children, ref.current!) : null;
};
