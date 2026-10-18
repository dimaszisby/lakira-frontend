import { THEMES } from "../../support/a11y";
import { newUser, preflightStack, registerUser, signIn } from "../../support/stack";

// Signing out, from the sidebar. No spec did it until 2026-10-18 (register row F-50), and its
// toast had never shown, because nothing mounted a `<Toaster>` (F-53).
// At 1280 px: below 1024 px there is no visible way to sign out (F-48, owner question O-11).
// Each test signs in afresh, since signing out ends the session a cached one would restore.
// Needs the local stack: `npm run test:e2e:stack`.
const DASHBOARD = "/dashboard";
const LOGIN = "/login";
const TOAST = "Logged out successfully";
const WIDTH = 1280;
const HEIGHT = 800;

describe("Signing out", () => {
  const user = newUser("signout");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  for (const theme of THEMES) {
    it(`signs out from the sidebar and says so, in the ${theme} theme`, () => {
      cy.viewport(WIDTH, HEIGHT);
      signIn(user);
      cy.visitInTheme(DASHBOARD, theme);

      // The desktop sidebar's button; the closed mobile drawer holds a second one off screen.
      cy.get("aside")
        .not('[aria-label="Mobile navigation"]')
        .first()
        .find('button[aria-label="Logout"]')
        .click();
      cy.get('button[aria-label="Confirm logout"]').click();

      cy.location("pathname").should("eq", LOGIN);
      cy.contains('[role="status"]', TOAST).should("be.visible");

      // Contrast is the point: the toast's colours are new. The check after it shows axe ran
      // with the toast on the page, not after it had gone.
      cy.checkPageA11y(`login after signing out (${theme})`);
      cy.contains('[role="status"]', TOAST).should("exist");

      // The session is gone, not just the page: a signed-in page sends the browser to sign in.
      cy.visit(DASHBOARD);
      cy.location("pathname").should("eq", LOGIN);
    });
  }
});
