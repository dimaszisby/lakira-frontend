import { THEMES } from "../../support/a11y";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The app's core journey: create a metric, see its card on the dashboard, log a value and see it
// in the log list. The 2026-10-04 audit recorded creating a metric and logging a value as not
// covered by any browser test, and until this spec no browser test had opened a metric's own
// page: every other signed-in spec uses a new account, which has no metric.
// Needs the local stack: `npm run test:e2e:stack`.
//
// It asserts no count on the dashboard card. The backend takes a card's figures from the first
// bucket of the range only, so a count there does not follow what was logged: Notion "FE and BE
// messages", Part 1, "Dashboard stats describe the first bucket only". Add the counts when that
// record is completed.
//
// The tests are one journey and run in order; each starts from what the one before left behind.
const THEME = "light";
const METRICS = "/metrics";
const DIALOG = '[role="dialog"]';
const SUBMIT = 'button[type="submit"]';
const TABS = 'nav[aria-label="Metric tabs"] a';
const METRIC_NAME = `Daily steps ${Date.now()}`;
const LOGGED_VALUE = "4200";
const VISIBLE = "be.visible";

describe("From a new metric to the dashboard", () => {
  const user = newUser("journey");
  // Set by the test that first opens the metric; the theme checks visit it directly.
  let metricPath = "";

  before(() => {
    preflightStack();
    registerUser(user);
  });

  beforeEach(() => {
    signInSession(user);
  });

  it("creates a metric from the metrics page", () => {
    cy.visitInTheme(METRICS, THEME);
    cy.get('button[aria-label="Create Metric"]').click();
    cy.get(DIALOG).within(() => {
      cy.get('input[name="name"]').type(METRIC_NAME);
      cy.get('input[name="defaultUnit"]').type("steps");
      cy.get(SUBMIT).click();
    });

    cy.get(DIALOG).should("not.exist");
    cy.contains(METRIC_NAME).should(VISIBLE);
  });

  it("shows the new metric's card on the dashboard at once", () => {
    cy.visitInTheme("/dashboard", THEME);

    cy.contains(METRIC_NAME).should(VISIBLE);
  });

  it("logs a value and lists it", () => {
    cy.visitInTheme(METRICS, THEME);
    cy.contains("button", METRIC_NAME).click();
    cy.location("pathname")
      .should("match", /^\/metrics\/[^/]+$/)
      .then((pathname) => {
        metricPath = pathname;
      });
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should("have.text", METRIC_NAME);

    cy.contains(TABS, "Logs").click();
    cy.get('button[aria-label="Create New Log"]').click();
    cy.get(DIALOG).within(() => {
      cy.get('input[name="logValue"]').type(LOGGED_VALUE);
      cy.get(SUBMIT).click();
    });

    cy.get(DIALOG).should("not.exist");
    cy.contains(LOGGED_VALUE).should(VISIBLE);
  });

  for (const theme of THEMES) {
    it(`has no violations on the metric's pages in the ${theme} theme`, () => {
      cy.visitInTheme(metricPath, theme);
      cy.contains(TABS, "Overview").should("have.attr", "aria-current", "page");
      cy.checkPageA11y(`metric overview (${theme})`);

      cy.contains(TABS, "Logs").click();
      cy.contains(LOGGED_VALUE).should(VISIBLE);
      cy.checkPageA11y(`metric logs (${theme})`);
    });
  }
});
