"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface CardStackContextType {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

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
    // No card stack on this page: the root not-found page renders chrome above
    // the (app) route group, outside CardStackProvider. Resetting is a no-op.
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
export const useCardStackStrict = (): CardStackContextType => {
  const context = useContext(CardStackContext);
  if (context === undefined) {
    throw new Error("useCardStackStrict must be used within a CardStackProvider");
  }
  return context;
};
