import "@testing-library/jest-dom";
import "jest-canvas-mock";

process.env.TZ = "UTC";

if (!globalThis.ResizeObserver) {
  class ResizeObserverMock implements ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}
