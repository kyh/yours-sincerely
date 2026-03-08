"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  animate,
  easeIn,
  mix,
  motion,
  progress,
  useMotionValue,
  useTransform,
  wrap,
} from "motion/react";

import { useRootHotkeys } from "@/lib/hotkey";

type CardStackContextType = {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
};

const CardStackContext = createContext<CardStackContextType | undefined>(
  undefined,
);

export const CardStackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const value: CardStackContextType = {
    currentIndex,
    setCurrentIndex,
  };

  return (
    <CardStackContext.Provider value={value}>
      {children}
    </CardStackContext.Provider>
  );
};

export const useCardStack = () => {
  const context = useContext(CardStackContext);
  if (context === undefined) {
    throw new Error("useCardStack must be used within a CardStackProvider");
  }
  return context;
};

type CardProps = {
  index: number;
  currentIndex: number;
  total: number;
  maxRotate: number;
  minDistance?: number;
  minSpeed?: number;
  setNextPost: () => void;
  children: React.ReactNode;
};

export const Card = ({
  index,
  currentIndex,
  total,
  maxRotate,
  setNextPost,
  minDistance = 400,
  minSpeed = 50,
  children,
}: CardProps) => {
  const baseRotation = mix(0, maxRotate, Math.sin(index));
  const x = useMotionValue(0);
  const rotate = useTransform(x, [0, 400], [baseRotation, baseRotation + 10], {
    clamp: false,
  });
  const zIndex = total - wrap(total, 0, index - currentIndex + 1);

  const onDragEnd = () => {
    const distance = Math.abs(x.get());
    const speed = Math.abs(x.getVelocity());

    if (distance > minDistance || speed > minSpeed) {
      setNextPost();

      animate(x, 0, {
        type: "spring",
        stiffness: 600,
        damping: 50,
      });
    } else {
      animate(x, 0, {
        type: "spring",
        stiffness: 300,
        damping: 50,
      });
    }
  };

  const opacity = progress(total * 0.25, total * 0.75, zIndex);

  const progressInStack = progress(0, total - 1, zIndex);
  const scale = mix(0.5, 1, easeIn(progressInStack));

  return (
    <motion.div
      className="absolute top-0 h-full w-full cursor-grab overflow-auto rounded-2xl"
      style={{
        zIndex,
        rotate,
        x,
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity, scale }}
      whileTap={index === currentIndex ? { scale: 0.98 } : {}}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 30,
      }}
      drag={index === currentIndex ? "x" : false}
      onDragEnd={onDragEnd}
    >
      <motion.div className="bg-card h-fit w-full rounded-2xl p-5 shadow-sm">
        {children}
      </motion.div>
    </motion.div>
  );
};

type Props<T> = {
  data: T[];
  render: (d: T) => React.ReactNode;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
};

export const CardStack = <T extends { id: string }>({
  data,
  render,
  hasNextPage,
  onLoadMore,
}: Props<T>) => {
  const { currentIndex, setCurrentIndex } = useCardStack();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.offsetWidth);
  }, []);

  const handleSetNextPost = () => {
    const postsLeft = data.length - currentIndex - 1;
    if (postsLeft <= 1 && hasNextPage && onLoadMore) onLoadMore();
    const newIndex = wrap(0, data.length, currentIndex + 1);
    setCurrentIndex(newIndex);
  };

  const handleSetPreviousPost = () => {
    const newIndex = wrap(0, data.length, currentIndex - 1);
    setCurrentIndex(newIndex);
  };

  useRootHotkeys([
    ["spacebar", handleSetNextPost],
    ["left", handleSetPreviousPost],
    ["right", handleSetNextPost],
  ]);

  return (
    <div className="card-stack flex h-full flex-col items-center gap-3">
      <div ref={ref} className="relative h-full w-full">
        {data.map((item, index) => {
          return (
            <Card
              key={item.id}
              minDistance={width * 0.5}
              maxRotate={3}
              index={index}
              currentIndex={currentIndex}
              total={data.length}
              setNextPost={handleSetNextPost}
            >
              {render(item)}
            </Card>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button size="sm" variant="ghost" onClick={handleSetPreviousPost}>
          Previous
        </Button>
        <Button size="sm" variant="outline" onClick={handleSetNextPost}>
          Next
        </Button>
      </div>
    </div>
  );
};
