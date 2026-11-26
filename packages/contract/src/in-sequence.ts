/**
 * Runs `step` on each item in order, starting each only after the previous one
 * settles. A rejection stops the run and rejects the returned promise.
 */
export const inSequence = async <T>(
  items: Iterable<T>,
  step: (item: T, index: number) => Promise<void>,
) => {
  const iterator = items[Symbol.iterator]();

  const runFrom = async (index: number) => {
    const result = iterator.next();

    if (result.done === true) {
      return;
    }

    await step(result.value, index);
    await runFrom(index + 1);
  };

  await runFrom(0);
};
