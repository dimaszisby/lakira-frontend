import { THEMES } from "../../support/a11y";
import { newUser, preflightStack, registerUser, signIn } from "../../support/stack";

// Signing out, from the desktop sidebar and, below `lg`, from the account page. No spec did it
// until 2026-10-18 (register row F-50), and its toast had never shown, because nothing mounted a
// `<Toaster>` (F-53). Below 1024 px there was no way to sign out until kit `mobile-sign-out`
// (F-48): the drawer that held the button was never opened, and was removed (D-01).
// Each test signs in afresh, since signing out ends the session a cached one would restore.
// Needs the local stack: `npm run test:e2e:stack`.
const DASHBOARD = "/dashboard";
const LOGIN = "/login";
const SIGN_OUT = "Sign out";
const TOAST = "Logged out successfully";
const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 600;
const HEIGHT = 800;

// The dialog's confirm button shares the trigger's name (D-02), so it is found inside the dialog.
const confirmSignOut = () => {
  cy.get('[role="dialog"]').contains("button", SIGN_OUT).click();
};

const assertSignedOut = (theme: string) => {
  cy.location("pathname").should("eq", LOGIN);
  cy.contains('[role="status"]', TOAST).should("be.visible");

  // Contrast is the point: the toast's colours are new. The check after it shows axe ran with
  // the toast on the page, not after it had gone.
  cy.checkPageA11y(`login after signing out (${theme})`);
  cy.contains('[role="status"]', TOAST).should("exist");

  // The session is gone, not just the page: a signed-in page sends the browser to sign in.
  cy.visit(DASHBOARD);
  cy.location("pathname").should("eq", LOGIN);
};

describe("Signing out", () => {
  const user = newUser("signout");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  for (const theme of THEMES) {
    it(`signs out from the sidebar and says so, in the ${theme} theme`, () => {
      cy.viewport(DESKTOP_WIDTH, HEIGHT);
      signIn(user);
      cy.visitInTheme(DASHBOARD, theme);

      cy.get("aside").contains("button", SIGN_OUT).click();
      confirmSignOut();

      assertSignedOut(theme);
    });

    it(`signs out from the account page on a phone, in the ${theme} theme`, () => {
      cy.viewport(PHONE_WIDTH, HEIGHT);
      signIn(user);
      cy.visitInTheme(DASHBOARD, theme);

      // The bottom bar is the only navigation below `lg`; its Account tab leads to the control.
      cy.get('nav[aria-label="Primary navigation"]').find('a[href="/account"]').click();
      cy.location("pathname").should("eq", "/account");
      cy.get("aside").should("not.be.visible");

      cy.get("main").contains("button", SIGN_OUT).should("be.visible").click();
      confirmSignOut();

      assertSignedOut(theme);
    });
  }
});
