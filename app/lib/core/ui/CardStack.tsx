import { useState, useEffect } from "react";
import type {
  MotionProps,
  PanInfo} from "framer-motion";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRootHotkeys } from "~/lib/core/util/hotkey";

type CardProps = {
  transition: MotionProps["transition"];
  animate: MotionProps["animate"];
  initial?: MotionProps["initial"];
  drag?: MotionProps["drag"];
  onNext?: (auto?: boolean) => void;
  exit?: {
    x: number;
    duration: number;
  };
  setExit?: (exit: { x: number; duration: number }) => void;
  children: React.ReactNode;
};

export const Card = (props: CardProps) => {
  const x = useMotionValue(0);
  const scale = useTransform(x, [-300, 0, 300], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-100, 0, 100], [-20, 0, 20], {
    clamp: false,
  });

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!event.x) return;
    if (info.offset.x < -100) {
      props.setExit &&
        props.setExit({
          x: -300,
          duration: 0.2,
        });
      props.onNext && props.onNext();
    }
    if (info.offset.x > 100) {
      props.setExit &&
        props.setExit({
          x: 300,
          duration: 0.2,
        });
      props.onNext && props.onNext();
    }
  };

  return (
    <motion.div
      className="absolute top-0 h-full w-full cursor-grab sm:w-[600px] sm:left-[50%] sm:ml-[-300px] rounded-2xl overflow-auto"
      style={{ x, rotate }}
      drag={props.drag}
      dragConstraints={{
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
      onDragEnd={handleDragEnd}
      initial={props.initial}
      animate={props.animate}
      transition={props.transition}
      exit={{
        x: props.exit?.x,
        opacity: 0,
        scale: 0.5,
        transition: { duration: props.exit?.duration },
      }}
    >
      <motion.div
        className="w-full h-fit p-5 rounded-2xl shadow-lg bg-slate-100 dark:bg-slate-900"
        style={{ scale }}
      >
        {props.children}
      </motion.div>
    </motion.div>
  );
};

type Props<T> = {
  data: T[];
  children: (d: T) => React.ReactNode;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  nextButton?: React.ReactNode;
};

export const CardStack = <T,>({
  data,
  children,
  hasNextPage,
  onLoadMore,
  nextButton = "Next",
}: Props<T>) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exit, setExit] = useState({
    x: -300,
    duration: 0.2,
  });
  const nextIndex = data[currentIndex + 1] ? currentIndex + 1 : 0;

  useEffect(() => {
    if (!data[currentIndex + 2] && hasNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [currentIndex]);

  const onNext = (auto?: boolean) => {
    if (auto) {
      setExit({
        x: Math.random() < 0.5 ? -300 : 300,
        duration: 0.5,
      });
    }
    requestAnimationFrame(() => {
      setCurrentIndex(nextIndex);
    });
  };

  useRootHotkeys([
    ["spacebar", () => onNext(true)],
    ["left", () => onNext(true)],
    ["right", () => onNext(true)],
  ]);

  return (
    <div className="h-full flex flex-col items-center gap-3">
      <div className="h-full w-full relative">
        <AnimatePresence initial={false}>
          <Card
            key={nextIndex}
            initial={{ scale: 0, y: 105, opacity: 0 }}
            animate={{ scale: 0.75, y: 30, opacity: 0.5 }}
            transition={{
              scale: { duration: 0.2 },
              opacity: { duration: 0.4 },
            }}
          >
            {children(data[nextIndex])}
          </Card>
          <Card
            key={currentIndex}
            onNext={onNext}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={
              {
                type: "spring",
                stiffness: 300,
                damping: 20,
                opacity: { duration: 0.2 },
              } as MotionProps["transition"]
            }
            exit={exit}
            setExit={setExit}
            drag="x"
          >
            {children(data[currentIndex])}
          </Card>
        </AnimatePresence>
      </div>
      {nextButton && (
        <button
          className="mt-auto py-2 px-3 transition rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() => onNext(true)}
        >
          {nextButton}
        </button>
      )}
    </div>
  );
};
