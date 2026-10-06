import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// ADR-0026, the signed-in half. The pages behind a session carry the app shell and every
// data-driven component, and they never run in CI (cypress-a11y-e2e D-01), so this is a local
// run: `npm run test:e2e:csp:stack`, with the backend up. It enforces the real policy, which the
// ordinary stack suite cannot: cypress-axe injects itself with `eval`.
const DASHBOARD = "/dashboard";
const APP_PAGES = [DASHBOARD, "/metrics", "/metric-categories", "/organization", "/account"];

type Violation = { directive: string; blocked: string };

describe("Signed-in pages under the enforced Content Security Policy", () => {
  const user = newUser("csp");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  it("is actually being enforced in this run", () => {
    expect(Cypress.config("experimentalCspAllowList"), "experimentalCspAllowList").to.include(
      "script-src",
    );

    signInSession(user);
    cy.request(DASHBOARD).then((response) => {
      const policy = String(response.headers["content-security-policy"]);
      expect(policy).to.match(/script-src [^;]*'nonce-[^']+'/);
      expect(policy).to.not.match(/script-src [^;]*'unsafe-inline'/);
    });
  });

  APP_PAGES.forEach((page) => {
    it(`renders ${page} with its data and reports no violation`, () => {
      const violations: Violation[] = [];
      cy.on("window:before:load", (win) => {
        win.document.addEventListener("securitypolicyviolation", (event) => {
          violations.push({ directive: event.violatedDirective, blocked: event.blockedURI });
        });
      });

      signInSession(user);
      cy.visitInTheme(page, "dark");

      // Still on the page asked for: a shell that failed to run would have been redirected or
      // left blank. The navigation landmark only exists once the client shell has rendered.
      cy.location("pathname").should("eq", page);
      cy.get("nav").should("be.visible");
      cy.get("main").should("be.visible");

      cy.then(() => {
        expect(violations, JSON.stringify(violations)).to.have.length(0);
      });
    });
  });

  it("navigates on the client between two sections without a violation", () => {
    const violations: Violation[] = [];
    cy.on("window:before:load", (win) => {
      win.document.addEventListener("securitypolicyviolation", (event) => {
        violations.push({ directive: event.violatedDirective, blocked: event.blockedURI });
      });
    });

    signInSession(user);
    cy.visitInTheme(DASHBOARD, "light");
    cy.get('a[href="/metrics"]').filter(":visible").first().click();
    cy.location("pathname").should("eq", "/metrics");

    cy.then(() => {
      expect(violations, JSON.stringify(violations)).to.have.length(0);
    });
  });
});
