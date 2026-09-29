import type { Theme } from "./a11y";

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      /** Visits `path` with `theme` stored before load, then waits for it to apply. */
      visitInTheme(
        path: string,
        theme: Theme,
        options?: Partial<Pick<VisitOptions, "failOnStatusCode">>,
      ): Chainable<void>;
      /** Runs axe over the page; fails on any WCAG 2.0/2.1 A or AA violation. */
      checkPageA11y(label: string): Chainable<void>;
    }
  }
}
