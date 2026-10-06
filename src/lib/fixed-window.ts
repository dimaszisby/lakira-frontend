/**
 * A fixed-window counter held in this process.
 *
 * It bounds a rate rather than metering it: a burst straddling two windows gets
 * through at twice the limit, and each server process counts separately. That
 * is enough to stop an unauthenticated endpoint from being used to fill a log
 * stream or spend a vendor quota, which is all it is for.
 */

type FixedWindowOptions = {
  /** Calls allowed per window. */
  limit: number;
  windowMs: number;
  /** Injected in tests. */
  now?: () => number;
};

export type FixedWindowResult = {
  /** Whether this call is inside the window's limit. */
  allowed: boolean;
  /**
   * Calls the previous window refused. Non-zero only on the first call of a new
   * window, so a caller can report a flood once instead of once per request.
   */
  suppressed: number;
};

export const createFixedWindow = ({
  limit,
  windowMs,
  // Monotonic, so a wall clock stepping backwards cannot hold a window open.
  // Read at call time, so a test's fake clock is the one consulted.
  now = () => performance.now(),
}: FixedWindowOptions): (() => FixedWindowResult) => {
  // The first call opens the first window, whatever the clock's origin.
  let windowStart = -Infinity;
  let count = 0;

  return () => {
    const time = now();
    let suppressed = 0;
    if (time - windowStart >= windowMs) {
      suppressed = Math.max(0, count - limit);
      windowStart = time;
      count = 0;
    }
    count += 1;
    return { allowed: count <= limit, suppressed };
  };
};
