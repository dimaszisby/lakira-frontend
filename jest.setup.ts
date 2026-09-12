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

// jsdom has no layout, so every element reports zero size. Ariakit decides what is
// focusable through Element.checkVisibility(), which jsdom does not implement:
// without it, dialogs cannot find a first tabbable element and focus traps break.
// Treat an element as visible unless it or an ancestor is hidden.
const isHiddenInTree = (element: Element) => {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node.hasAttribute("hidden")) return true;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return true;
  }
  return false;
};

if (typeof Element !== "undefined" && !("checkVisibility" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "checkVisibility", {
    configurable: true,
    value(this: Element) {
      return this.isConnected && !isHiddenInTree(this);
    },
  });
}

// jsdom has no `inert`. Without it Ariakit falls back to a polyfill that replaces
// `element.focus`, which collides with user-event's own focus patching and throws.
// Reflecting the attribute lets Ariakit take its standard path.
if (typeof HTMLElement !== "undefined" && !("inert" in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, "inert", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("inert");
    },
    set(this: HTMLElement, value: boolean) {
      this.toggleAttribute("inert", Boolean(value));
    },
  });
}
