import type React from "react";
import type { DOMAttributes } from "react";
import type {
  CalendarDay,
  CalendarLevel,
  CalendarTheme,
  CalendarWeeks,
} from "@repo/contracts/calendar";

export type Level = CalendarLevel;
export type Day = CalendarDay;
export type Weeks = CalendarWeeks;
export type Labels = Partial<{
  readonly months: string[];
  readonly weekdays: string[];
  readonly totalCount: string;
  readonly legend: Partial<{
    readonly less: string;
    readonly more: string;
  }>;
}>;

export type Theme = CalendarTheme;

export type SVGRectEventHandler = Omit<
  DOMAttributes<SVGRectElement>,
  "css" | "children" | "dangerouslySetInnerHTML"
>;

export type EventHandlerMap = {
  [key in keyof SVGRectEventHandler]: (
    ...event: Parameters<NonNullable<SVGRectEventHandler[keyof SVGRectEventHandler]>>
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
