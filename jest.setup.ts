import "@testing-library/jest-dom";
import "jest-canvas-mock";

import { toHaveNoViolations } from "jest-axe";

process.env.TZ = "UTC";

expect.extend(toHaveNoViolations);

if (!globalThis.ResizeObserver) {
  class ResizeObserverMock implements ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}
