import { useState, useEffect } from "react";
import {
  MotionProps,
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const cardWidth = 600;

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

  const handleDragEnd = (_event: any, info: any) => {
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
      className="absolute top-0 left-[50%] h-full cursor-grab"
      style={{
        width: cardWidth,
        marginLeft: -(cardWidth / 2),
        x: x,
        rotate: rotate,
      }}
      whileTap={{ cursor: "grabbing" }}
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
        className="w-full h-full p-5 shadow-lg rounded-3xl bg-slate-100 dark:bg-slate-900"
        style={{ scale: scale }}
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

  return (
    <div className="h-full flex flex-col items-center gap-3">
      <div className="h-full relative">
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
            drag
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
