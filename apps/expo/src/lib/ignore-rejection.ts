/** For work whose failure already surfaces elsewhere — query state, a toast the
    caller owns, a retry on the next foreground — so it must never become an
    unhandled rejection. `void` it to fire and forget, `await` it to sequence. */
export const ignoreRejection = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch {
    // The caller's own state reports this failure.
  }
};
