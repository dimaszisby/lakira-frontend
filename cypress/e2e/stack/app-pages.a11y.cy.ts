import { THEMES } from "../../support/a11y";
import {
  newUser,
  preflightStack,
  registerUser,
  signInSession,
  tokenFor,
} from "../../support/stack";

// AC-5 of cypress-a11y-e2e. Needs the local stack: `npm run test:e2e:stack`.
const APP_PAGES: readonly { path: string; label: string }[] = [
  { path: "/dashboard", label: "dashboard" },
  { path: "/metrics", label: "metrics" },
  { path: "/metric-categories", label: "metric categories" },
  { path: "/organization", label: "organization" },
  { path: "/account", label: "account" },
];

describe("Signed-in pages meet WCAG 2.1 A and AA", () => {
  const user = newUser("pages");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  it("verifies the new address from the emailed link", () => {
    tokenFor(user.email, "verify").then((token) => {
      cy.visitInTheme(`/verify-email?token=${encodeURIComponent(token)}`, "light");
    });
    cy.contains("Email verified").should("be.visible");
    cy.checkPageA11y("verify email, success (light)");
  });

  for (const theme of THEMES) {
    for (const { path, label } of APP_PAGES) {
      it(`has no violations on ${label} in the ${theme} theme`, () => {
        signInSession(user);
        cy.visitInTheme(path, theme);
        cy.checkPageA11y(`${label} (${theme})`);
      });
    }
  }
});
