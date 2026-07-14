"use client";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@repo/ui/components/button";
import {
  animate,
  easeIn,
  m,
  mix,
  progress,
  useMotionValue,
  useTransform,
  wrap,
} from "motion/react";

import { useHotkeys } from "@/lib/use-hotkey";

type CardStackContextType = {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
};

const CardStackContext = createContext<CardStackContextType | undefined>(undefined);

export const CardStackProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const value = useMemo<CardStackContextType>(
    () => ({ currentIndex, setCurrentIndex }),
    [currentIndex],
  );

  return <CardStackContext.Provider value={value}>{children}</CardStackContext.Provider>;
};

const NO_CARD_STACK: CardStackContextType = {
  currentIndex: 0,
  setCurrentIndex: () => {
    // No card stack on this page (e.g. error/404, which render chrome above the
    // (app) route group, outside CardStackProvider). Resetting is a no-op.
  },
};

/**
 * Safe for chrome (AsideHeader, Sidebar) that renders both inside the (app)
 * group and above it. Falls back to a no-op stack when there is no provider.
 */
export const useCardStack = (): CardStackContextType =>
  useContext(CardStackContext) ?? NO_CARD_STACK;

/**
 * For the feed itself, where a missing provider is a genuine mounting mistake:
 * the stack would silently never advance. Throws instead.
 */
const useCardStackStrict = (): CardStackContextType => {
  const context = useContext(CardStackContext);
  if (context === undefined) {
    throw new Error("useCardStackStrict must be used within a CardStackProvider");
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

const Card = memo(function Card({
  index,
  currentIndex,
  total,
  maxRotate,
  setNextPost,
  minDistance = 400,
  minSpeed = 50,
  children,
}: CardProps) {
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
    <m.div
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
      <m.div className="bg-card h-fit w-full rounded-2xl p-5 shadow-sm">{children}</m.div>
    </m.div>
  );
});

type Props<T> = {
  data: T[];
  render: (d: T) => React.ReactNode;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
};

/** Only a handful of cards are ever visible: the current one, the two behind it,
    and the one you land on going backwards. Mounting the rest gains nothing and
    costs a drag-enabled motion node each. */
const WINDOW_BEFORE = 1;
const WINDOW_AFTER = 2;

export const CardStack = <T extends { id: string }>({
  data,
  render,
  hasNextPage,
  onLoadMore,
}: Props<T>) => {
  const { currentIndex, setCurrentIndex } = useCardStackStrict();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.offsetWidth);
  }, []);

  const total = data.length;

  // `currentIndex` lives in CardStackProvider (mounted in the (app) layout), so
  // it outlives the feed data it indexes. The feed can shrink (block/delete
  // invalidation, or a refetch simply returning fewer posts) below currentIndex;
  // wrap it back into range so exactly one card stays gesture-enabled. Without
  // this, no card satisfies `index === currentIndex` and the stack goes dead.
  const safeIndex = total > 0 ? wrap(0, total, currentIndex) : 0;

  // The handlers are handed to a memoized Card, so they must not change identity
  // on every swipe. Read the moving parts from a ref instead of closing over them.
  const latest = useRef({ total, safeIndex, hasNextPage, onLoadMore });
  latest.current = { total, safeIndex, hasNextPage, onLoadMore };

  const handleSetNextPost = useCallback(() => {
    const { total, safeIndex, hasNextPage, onLoadMore } = latest.current;
    if (total === 0) return;
    // Unchanged by windowing: this is derived from the full data length, not
    // from how many cards happen to be mounted.
    const postsLeft = total - safeIndex - 1;
    if (postsLeft <= 1 && hasNextPage && onLoadMore) onLoadMore();
    setCurrentIndex(wrap(0, total, safeIndex + 1));
  }, [setCurrentIndex]);

  const handleSetPreviousPost = useCallback(() => {
    const { total, safeIndex } = latest.current;
    if (total === 0) return;
    setCurrentIndex(wrap(0, total, safeIndex - 1));
  }, [setCurrentIndex]);

  // Same three bindings as before; the aliases are spelled as the literal
  // `event.key` values that @react-hook/hotkey resolved them to.
  useHotkeys([
    [" ", handleSetNextPost],
    ["arrowleft", handleSetPreviousPost],
    ["arrowright", handleSetNextPost],
  ]);

  // Rendered once per data change, NOT per swipe, so each card's children keep a
  // stable element identity and memo() can bail out of the PostContent subtree.
  const rendered = useMemo(() => data.map((item) => render(item)), [data, render]);

  // The window wraps at both ends (the stack cycles). A Set keeps it correct when
  // the feed is shorter than the window and offsets would collide.
  const windowed = useMemo(() => {
    if (total === 0) return [];
    const seen = new Set<number>();
    const cards: { item: T; node: React.ReactNode; index: number }[] = [];

    for (let offset = -WINDOW_BEFORE; offset <= WINDOW_AFTER; offset++) {
      const index = wrap(0, total, safeIndex + offset);
      if (seen.has(index)) continue;
      seen.add(index);

      const item = data[index];
      const node = rendered[index];
      if (item === undefined) continue;

      cards.push({ item, node, index });
    }

    return cards;
  }, [data, rendered, safeIndex, total]);

  return (
    <div className="card-stack flex h-full flex-col items-center gap-3">
      <div ref={ref} className="relative h-full w-full">
        {windowed.map(({ item, node, index }) => (
          <Card
            key={item.id}
            minDistance={width * 0.5}
            maxRotate={3}
            index={index}
            currentIndex={safeIndex}
            total={total}
            setNextPost={handleSetNextPost}
          >
            {node}
          </Card>
        ))}
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
