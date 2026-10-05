import { defineConfig } from "cypress";

import type { MailKind } from "./cypress/support/mailpit";
import { probe, tokenFromMailpit } from "./cypress/support/mailpit";

const MAILPIT_URL = process.env.E2E_MAILPIT_URL || "http://localhost:8025";

/**
 * Cypress removes Content-Security-Policy headers from the app's responses by default, and with
 * the allow-list merely set to `true` it still removes `script-src`, the directive ADR-0026 is
 * about. `npm run test:e2e:csp` sets E2E_ENFORCE_CSP so the directives named here reach the
 * browser and are enforced. Off for the other suites: cypress-axe injects itself with `eval`,
 * which the production policy rightly refuses.
 */
const ENFORCED_CSP_DIRECTIVES: Cypress.experimentalCspAllowedDirectives[] = [
  "default-src",
  "script-src",
  "script-src-elem",
  "form-action",
];
const isCspEnforced = process.env.E2E_ENFORCE_CSP === "1";

export default defineConfig({
  // Public configuration goes through `expose`, read with Cypress.expose(). Nothing here is secret.
  allowCypressEnv: false,
  experimentalCspAllowList: isCspEnforced ? ENFORCED_CSP_DIRECTIVES : false,
  expose: {
    mailpitUrl: MAILPIT_URL,
    backendUrl: process.env.E2E_BACKEND_URL || "http://localhost:8001/api/v1",
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://127.0.0.1:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on) {
      on("task", {
        // Accessibility violations are printed here so a CI log names them (cypress/support/a11y.ts).
        log(message: string) {
          process.stdout.write(`${message}\n`);
          return null;
        },
        // Stack specs only (cypress/support/stack.ts).
        probe(url: string) {
          return probe(url);
        },
        mailpitToken({ email, kind }: { email: string; kind: MailKind }) {
          return tokenFromMailpit(MAILPIT_URL, email, kind);
        },
      });
    },
  },
  video: true,
});
