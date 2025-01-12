"use client";

import type { MotionProps, PanInfo } from "motion/react";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";

import { useRootHotkeys } from "@/lib/hotkey";

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
  onAnimationComplete?: () => void;
  children: React.ReactNode;
};

const cardDragConstraints = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const Card = (props: CardProps) => {
  const x = useMotionValue(0);
  const scale = useTransform(x, [-300, 0, 300], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-100, 0, 100], [-20, 0, 20], {
    clamp: false,
  });

  const handleDragEnd = (event: MouseEvent, info: PanInfo) => {
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
      className="absolute top-0 h-full w-full cursor-grab overflow-auto rounded-2xl sm:left-[50%] sm:ml-[-300px] sm:w-[600px]"
      style={{ x, rotate }}
      dragDirectionLock
      drag={props.drag}
      dragConstraints={cardDragConstraints}
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
      onAnimationComplete={props.onAnimationComplete}
    >
      <motion.div
        className="h-fit w-full rounded-2xl p-5 shadow-lg"
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
  const [animating, setAnimating] = useState(false);
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
    if (animating) return;
    if (auto) {
      setExit({
        x: Math.random() < 0.5 ? -300 : 300,
        duration: 0.5,
      });
    }
    setAnimating(true);
    setCurrentIndex(nextIndex);
  };

  useRootHotkeys([
    ["spacebar", () => onNext(true)],
    ["left", () => onNext(true)],
    ["right", () => onNext(true)],
  ]);

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div className="relative h-full w-full">
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
            {children(data[nextIndex]!)}
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
            onAnimationComplete={() => setAnimating(false)}
          >
            {children(data[currentIndex]!)}
          </Card>
        </AnimatePresence>
      </div>
      {nextButton && (
        <button
          className="mt-auto rounded-lg px-3 py-2 transition"
          onClick={() => onNext(true)}
          disabled={animating}
        >
          {nextButton}
        </button>
      )}
    </div>
  );
};
