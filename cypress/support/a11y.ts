import type { Result } from "axe-core";

import { THEME_STORAGE_KEY } from "../../src/constants/app";

export type Theme = "light" | "dark";

/** Every page is checked in both themes (cypress-a11y-e2e D-04). */
export const THEMES: readonly Theme[] = ["light", "dark"];

/**
 * WCAG 2.0 and 2.1, levels A and AA: the baseline in docs/reference/accessibility-baseline.md.
 * axe's best-practice rules are outside it (cypress-a11y-e2e D-03).
 */
const WCAG_A_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * The only elements excluded from `color-contrast`, and why. Every entry cites an ADR or a WCAG
 * criterion; an exclusion without one does not belong here.
 */
const CONTRAST_EXCLUSIONS: readonly { selector: string; reason: string }[] = [
  {
    selector: ".button",
    reason:
      "ADR-0017: Button colour tokens fail WCAG 1.4.3 in both themes; accepted, a brand decision",
  },
  {
    // The APP_NAME link in src/components/layout/Header.tsx: 2.15:1 in light, measured 2026-09-29.
    selector: 'header a[href="/"]',
    reason:
      "WCAG 1.4.3 exempts logotypes, text that is part of a logo or brand name (cypress-a11y-e2e D-07)",
  },
];

const formatViolations = (label: string, violations: Result[]): string =>
  [
    `${violations.length} accessibility violation(s) on ${label}:`,
    ...violations.map((violation) =>
      [
        `- ${violation.id} [${violation.impact ?? "unknown"}] ${violation.help}`,
        `  ${violation.helpUrl}`,
        ...violation.nodes.flatMap((node) => [
          `  at ${node.target.join(" ")}`,
          ...(node.failureSummary ?? "").split("\n").map((line) => `    ${line}`),
        ]),
      ].join("\n"),
    ),
  ].join("\n");

const reportTo = (label: string) => (violations: Result[]) => {
  // To the terminal, so a CI log says what to fix without opening a video.
  cy.task("log", formatViolations(label, violations));
};

/**
 * Loads `path` with `theme` already stored, as a returning user's choice would be, and waits until
 * next-themes has applied it.
 */
Cypress.Commands.add("visitInTheme", (path: string, theme: Theme, options = {}) => {
  cy.visit(path, {
    ...options,
    onBeforeLoad(win) {
      win.localStorage.setItem(THEME_STORAGE_KEY, theme);
    },
  });
  cy.get("html").should("have.attr", "data-theme", theme);
  cy.get("main").should("exist");
});

/**
 * Runs axe over the whole rendered page and fails on any WCAG A/AA violation.
 *
 * Two passes, because axe can only exclude elements for a whole run: every rule except
 * `color-contrast` over the full page, then `color-contrast` alone without the documented
 * exclusions.
 */
Cypress.Commands.add("checkPageA11y", (label: string) => {
  cy.injectAxe();

  cy.checkA11y(
    undefined,
    {
      runOnly: { type: "tag", values: WCAG_A_AA_TAGS },
      rules: { "color-contrast": { enabled: false } },
    },
    reportTo(label),
  );

  cy.checkA11y(
    { include: [["html"]], exclude: CONTRAST_EXCLUSIONS.map(({ selector }) => [selector]) },
    { runOnly: { type: "rule", values: ["color-contrast"] } },
    reportTo(`${label} (color-contrast)`),
  );
});
