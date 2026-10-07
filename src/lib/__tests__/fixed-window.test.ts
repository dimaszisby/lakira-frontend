import { createFixedWindow } from "../fixed-window";

const WINDOW_MS = 60_000;

describe("createFixedWindow", () => {
  let time: number;
  const now = () => time;

  beforeEach(() => {
    time = 1_000_000;
  });

  it("allows calls up to the limit and refuses the rest of the window", () => {
    const take = createFixedWindow({ limit: 2, windowMs: WINDOW_MS, now });

    expect(take().allowed).toBe(true);
    expect(take().allowed).toBe(true);
    expect(take().allowed).toBe(false);
    expect(take().allowed).toBe(false);
  });

  it("allows calls again when the window has passed", () => {
    const take = createFixedWindow({ limit: 1, windowMs: WINDOW_MS, now });
    take();
    expect(take().allowed).toBe(false);

    time += WINDOW_MS - 1;
    expect(take().allowed).toBe(false);

    time += 1;
    expect(take().allowed).toBe(true);
  });

  it("reports what the last window refused, once, on the first call of the next", () => {
    const take = createFixedWindow({ limit: 1, windowMs: WINDOW_MS, now });
    take();
    take();
    take();

    time += WINDOW_MS;
    expect(take()).toEqual({ allowed: true, suppressed: 2 });
    expect(take()).toEqual({ allowed: false, suppressed: 0 });
  });

  it("reports nothing suppressed after a window that stayed inside its limit", () => {
    const take = createFixedWindow({ limit: 2, windowMs: WINDOW_MS, now });
    take();
    take();

    time += WINDOW_MS;
    expect(take()).toEqual({ allowed: true, suppressed: 0 });
  });

  it("reads the clock at call time when none is injected", () => {
    jest.useFakeTimers();
    try {
      const take = createFixedWindow({ limit: 1, windowMs: WINDOW_MS });
      take();
      expect(take().allowed).toBe(false);

      jest.advanceTimersByTime(WINDOW_MS);
      expect(take().allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
