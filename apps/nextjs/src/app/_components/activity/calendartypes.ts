import type React from "react";
import type { DOMAttributes } from "react";

export type Level = 0 | 1 | 2 | 3 | 4;

export type Day = {
  date: string;
  count: number;
  level: Level;
}

type Week = (Day | undefined)[];
export type Weeks = Week[]
export type Labels = Partial<{
  readonly months: string[];
  readonly weekdays: string[];
  readonly totalCount: string;
  readonly legend: Partial<{
    readonly less: string;
    readonly more: string;
  }>;
}>;

export type Theme = {
  readonly level4: string;
  readonly level3: string;
  readonly level2: string;
  readonly level1: string;
  readonly level0: string;
  readonly stroke: string;
}

export type SVGRectEventHandler = Omit<
  DOMAttributes<SVGRectElement>,
  "css" | "children" | "dangerouslySetInnerHTML"
>;

export type EventHandlerMap = {
  [key in keyof SVGRectEventHandler]: (
    ...event: Parameters<
      NonNullable<SVGRectEventHandler[keyof SVGRectEventHandler]>
    >
  ) => (data: Day) => void;
};

export type ReactEvent<E extends Element> = React.AnimationEvent<E> &
  React.ClipboardEvent<E> &
  React.CompositionEvent<E> &
  React.DragEvent<E> &
  React.FocusEvent<E> &
  React.FormEvent<E> &
  React.KeyboardEvent<E> &
  React.MouseEvent<E> &
  React.PointerEvent<E> &
  React.SyntheticEvent<E> &
  React.TouchEvent<E> &
  React.TransitionEvent<E> &
  React.UIEvent<E> &
  React.WheelEvent<E>;
