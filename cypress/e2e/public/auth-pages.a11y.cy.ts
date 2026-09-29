import { THEMES } from "../../support/a11y";

// Public pages only: nothing here may call the backend, because CI runs without one
// (cypress-a11y-e2e D-01). The token pages are visited without a token, which renders their
// "link is not valid" state and sends no request.
const PUBLIC_PAGES: readonly { path: string; label: string; status?: number }[] = [
  { path: "/", label: "home" },
  { path: "/login", label: "login" },
  { path: "/register", label: "register" },
  { path: "/forgot-password", label: "forgot password" },
  { path: "/reset-password", label: "reset password, no token" },
  { path: "/verify-email", label: "verify email, no token" },
  { path: "/invites/accept", label: "accept invite, no token" },
  { path: "/this-page-does-not-exist", label: "not found", status: 404 },
];

describe("Public pages meet WCAG 2.1 A and AA", () => {
  for (const theme of THEMES) {
    for (const { path, label, status } of PUBLIC_PAGES) {
      it(`has no violations on ${label} in the ${theme} theme`, () => {
        cy.visitInTheme(path, theme, { failOnStatusCode: status === undefined });
        cy.checkPageA11y(`${label} (${theme})`);
      });
    }
  }
});
