/** A counter shows plain text until its value first changes, and only then
    mounts the odometer. `from` is the value before the latest change — where
    a freshly mounted column starts, so the first change still rolls — or
    null while the plain text should show. */
export interface CounterState {
  value: number;
  from: number | null;
}

/** Returns `state` itself when nothing changed, so a render can compare by
    identity before setting state. Reduce motion shows plain text and forgets
    `from`: turning it back off must not roll from a stale value. */
export const nextCounterState = (state: CounterState, value: number, reduceMotion: boolean) => {
  if (value !== state.value) {
    return { from: reduceMotion ? null : state.value, value };
  }

  if (reduceMotion && state.from !== null) {
    return { from: null, value };
  }

  return state;
};

export interface OdometerColumn {
  /** Place value (ones = 0): a column keeps its identity as leading digits come and go. */
  position: number;
  digit: number;
  /** The digit this place showed before the change, or null for a place the
      previous value did not have — that column fades in on its own digit. */
  from: number | null;
}

export const odometerColumns = (value: number, from: number) => {
  const digits = Array.from(String(value), Number);
  const fromDigits = Array.from(String(from), Number);

  return digits.map((digit, index) => {
    const position = digits.length - 1 - index;
    const fromDigit = fromDigits.at(-1 - position);

    return {
      digit,
      from: fromDigit ?? null,
      position,
    };
  });
};
