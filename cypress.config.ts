import { defineConfig } from "cypress";

import type { MailKind } from "./cypress/support/mailpit";
import { probe, tokenFromMailpit } from "./cypress/support/mailpit";

const MAILPIT_URL = process.env.E2E_MAILPIT_URL || "http://localhost:8025";

export default defineConfig({
  // Public configuration goes through `expose`, read with Cypress.expose(). Nothing here is secret.
  allowCypressEnv: false,
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
