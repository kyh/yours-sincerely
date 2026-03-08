/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePrevious, useWindowScroll, useWindowSize } from "react-use";

type ScrollObserverContextType = {
  active: number | null;
  setActive: (index: number | null) => void;
  previous: number | null;
};
const ScrollObserverContext = createContext<ScrollObserverContextType | null>(
  null,
);

type GroupContextType = {
  peers: Element[];
};
const TriggerGroupContext = createContext<GroupContextType | null>(null);
const ReactorGroupContext = createContext<GroupContextType | null>(null);

type RootProps = {
  as?: React.ElementType;
  children: React.ReactNode | ((isHidden: boolean) => React.ReactNode);
  className?: string;
};

const Root = ({
  as: Component = "div",
  children,
  className,
  ...props
}: RootProps) => {
  const [active, setActive] = useState<number | null>(null);
  const previous = usePrevious<number | null>(active) ?? null;
  const isHidden = useMemo(() => active === null, [active]);

  const context = {
    active,
    setActive,
    previous,
  };

  return (
    <ScrollObserverContext.Provider value={context}>
      <Component className={className} {...props}>
        {typeof children === "function" ? children(isHidden) : children}
      </Component>
    </ScrollObserverContext.Provider>
  );
};

type TriggerGroupProps = {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
};

const TriggerGroup = ({
  as: Component = "div",
  children,
  className,
  ...props
}: TriggerGroupProps) => {
  const container = useRef<Element>(null);
  const [childElements, setChildElements] = useState<Element[]>([]);

  useEffect(() => {
    if (container.current) {
      const children = Array.from(container.current.children);
      setChildElements(children);
    }
  }, []);

  const context = { peers: childElements };

  return (
    <TriggerGroupContext.Provider value={context}>
      <Component ref={container} className={className} {...props}>
        {children}
      </Component>
    </TriggerGroupContext.Provider>
  );
};

type TriggerProps = {
  as?: React.ElementType;
  children: (isActive: boolean) => React.ReactNode;
  className?: string;
};

const Trigger = ({
  as: Component = "div",
  children,
  className,
  ...props
}: TriggerProps) => {
  const container = useRef<Element>();
  const scrollObserverContext = useContext(ScrollObserverContext);
  const triggerGroupContext = useContext(TriggerGroupContext);

  // current element index
  const index = useMemo(() => {
    if (!triggerGroupContext || !container.current) return -1;
    return triggerGroupContext.peers.indexOf(container.current);
  }, [triggerGroupContext?.peers]);

  const isFirst = useMemo(() => index === 0, [index]);

  const isLast = useMemo(() => {
    if (!triggerGroupContext) return false;
    return index === triggerGroupContext.peers.length - 1;
  }, [index]);

  // active element
  const isActive = useMemo(
    () => scrollObserverContext?.active === index,
    [scrollObserverContext?.active],
  );

  // component logic
  const { height: windowHeight } = useWindowSize();
  const { y: windowScroll } = useWindowScroll();

  const [y, setY] = useState(-1);
  const [height, setHeight] = useState(-1);

  useEffect(() => {
    setY(container.current?.getBoundingClientRect().top ?? 0);
    setHeight(container.current?.getBoundingClientRect().height ?? 0);
  }, [windowScroll]);

  const isVisible = useMemo(() => {
    return y > windowHeight / 2 - height && y <= windowHeight / 2;
  }, [windowHeight, y, height]);

  useEffect(() => {
    if (isVisible) {
      scrollObserverContext?.setActive(index);
    } else if (isFirst && y > windowHeight / 2 - height) {
      scrollObserverContext?.setActive(null);
    } else if (isLast && y <= windowHeight / 2) {
      scrollObserverContext?.setActive(null);
    }
  }, [isVisible, isFirst, isLast, y, windowHeight, height]);

  return (
    <Component ref={container} className={className} {...props}>
      {children(isActive)}
    </Component>
  );
};

type ReactorGroupProps = {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
};

export const ReactorGroup = ({
  as: Component = "div",
  children,
  className,
  ...props
}: ReactorGroupProps) => {
  const container = useRef<Element>(null);
  const [childElements, setChildElements] = useState<Element[]>([]);

  useEffect(() => {
    if (container.current) {
      const children = Array.from(container.current.children);
      setChildElements(children);
    }
  }, []);

  const context = { peers: childElements };

  return (
    <ReactorGroupContext.Provider value={context}>
      <Component ref={container} className={className} {...props}>
        {children}
      </Component>
    </ReactorGroupContext.Provider>
  );
};

type ReactorProps = {
  as?: React.ElementType;
  children: (isActive: boolean) => React.ReactNode;
  className?: string;
};

export const Reactor = ({
  as: Component = "div",
  children,
  className,
  ...props
}: ReactorProps) => {
  const container = useRef<Element>(null);
  const scrollObserverContext = useContext(ScrollObserverContext);
  const reactorGroupContext = useContext(ReactorGroupContext);

  const index = useMemo(() => {
    if (!reactorGroupContext || !container.current) return -1;
    return reactorGroupContext.peers.indexOf(container.current);
  }, [reactorGroupContext?.peers]);

  // active element
  const isActive = useMemo(
    () => scrollObserverContext?.active === index,
    [scrollObserverContext?.active],
  );

  return (
    <Component ref={container} className={className} {...props}>
      {children(isActive)}
    </Component>
  );
};

export const ScrollObserver = Object.assign(Root, {
  TriggerGroup,
  Trigger,
  ReactorGroup,
  Reactor,
});
