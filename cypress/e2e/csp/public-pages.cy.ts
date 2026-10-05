// ADR-0026: script runs by a per-request nonce, and the policy no longer allows inline script.
//
// Cypress removes Content-Security-Policy headers from every response by default, so the other
// suites would pass with a policy that blocked the whole app. This spec is run by
// `npm run test:e2e:csp`, which sets E2E_ENFORCE_CSP so `cypress.config.ts` lets `script-src`
// through and the browser enforces it.

type Violation = { directive: string; blocked: string };

const PAGES = ["/", "/login", "/register", "/forgot-password"];

/** Records every violation the browser reports for the page under test. */
const watchViolations = (): Violation[] => {
  const violations: Violation[] = [];
  cy.on("window:before:load", (win) => {
    win.document.addEventListener("securitypolicyviolation", (event) => {
      violations.push({ directive: event.violatedDirective, blocked: event.blockedURI });
    });
  });
  return violations;
};

describe("Content Security Policy, enforced", () => {
  it("is actually being enforced in this run", () => {
    // If the allow-list is off, or `true`, Cypress strips `script-src` and every test below
    // passes vacuously. The injection test at the end is the proof; this names the cause first.
    expect(Cypress.config("experimentalCspAllowList"), "experimentalCspAllowList").to.include(
      "script-src",
    );

    cy.request("/login").then((response) => {
      const policy = String(response.headers["content-security-policy"]);
      expect(policy).to.match(/script-src [^;]*'nonce-[^']+'/);
      expect(policy).to.match(/script-src [^;]*'strict-dynamic'/);
      expect(policy.split(";").find((part) => part.trim().startsWith("script-src"))).to.not.include(
        "'unsafe-inline'",
      );
    });
  });

  // AC-6.
  PAGES.forEach((page) => {
    it(`lets ${page} run its scripts and reports no violation`, () => {
      const violations = watchViolations();

      // `visitInTheme` waits for `data-theme` on <html>, which only script can set: the pre-paint
      // theme script is the one inline script Next does not stamp with the nonce itself.
      cy.visitInTheme(page, "dark");
      cy.get("h1, h2").first().should("be.visible");

      cy.then(() => {
        expect(violations, JSON.stringify(violations)).to.have.length(0);
      });
    });
  });

  it("hydrates: a control driven by React state responds on /login", () => {
    const violations = watchViolations();

    cy.visitInTheme("/login", "light");
    cy.get('input[name="password"]').should("have.attr", "type", "password");
    cy.get('button[aria-label="Show password"]').click();
    cy.get('input[name="password"]').should("have.attr", "type", "text");

    cy.then(() => {
      expect(violations, JSON.stringify(violations)).to.have.length(0);
    });
  });

  // AC-9. Markup an attacker gets into the page, in the two forms that run without a script
  // element of their own: an inline event handler and a `javascript:` URL.
  //
  // Not tested as blocked, because it is not: a script element *built by script that is already
  // running* is allowed. That is what `'strict-dynamic'` means, measured on 2026-10-05 and
  // recorded in ADR-0026. Whoever can call `createElement` is already executing.
  it("blocks an injected inline event handler and an injected javascript: URL", () => {
    const violations = watchViolations();

    cy.visitInTheme("/login", "light");
    cy.window().then((win) => {
      const holder = win.document.createElement("div");
      holder.innerHTML =
        '<img src="/no-such-image.png" onerror="window.__handlerRan = true">' +
        '<a id="injected-link" href="javascript:window.__urlRan = true">x</a>';
      win.document.body.appendChild(holder);
      win.document.getElementById("injected-link")?.click();
    });

    cy.wrap(violations).should("have.length.at.least", 2);
    cy.window().then((win) => {
      const flags = win as unknown as { __handlerRan?: boolean; __urlRan?: boolean };
      expect(flags.__handlerRan, "inline handler").to.equal(undefined);
      expect(flags.__urlRan, "javascript: URL").to.equal(undefined);
      expect(violations.map((violation) => violation.directive)).to.include("script-src-attr");
    });
  });
});
