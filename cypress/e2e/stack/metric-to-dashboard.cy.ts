import { THEMES } from "../../support/a11y";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The app's core journey: create a metric, see its card on the dashboard, log a value and see it
// in the log list. The 2026-10-04 audit recorded creating a metric and logging a value as not
// covered by any browser test, and until this spec no browser test had opened a metric's own
// page: every other signed-in spec uses a new account, which has no metric.
// Needs the local stack: `npm run test:e2e:stack`.
//
// It asserts the card's count three times: nothing logged, one value, and a second value with the
// dashboard reached through the back button. The counts after a log could not be asserted until
// backend #147, which made the dashboard's ETag follow its body and dropped the one-minute browser
// cache.
//
// The back-button case checks what the user sees, not the dashboard invalidation in the create-log
// mutation: it passes with that call removed (measured 2026-10-09, no dashboard request from the
// browser). Closing the log dialog refreshes the router (`MetricLogFormDialog`), so going back
// renders the dashboard on the server again and its prefetch supplies the new figures.
//
// A value logged today is counted only because the metric is new: `last=7d` ends at the start of
// today in UTC, and a metric with nothing in that range is answered from the range of its latest
// logs. Notion "FE and BE messages", Part 1, "Relative ranges exclude today".
//
// The tests are one journey and run in order; each starts from what the one before left behind.
const THEME = "light";
const METRICS = "/metrics";
const DIALOG = '[role="dialog"]';
const SUBMIT = 'button[type="submit"]';
const TABS = 'nav[aria-label="Metric tabs"] a';
const METRIC_NAME = `Daily steps ${Date.now()}`;
const LOGGED_VALUE = "4200";
const SECOND_VALUE = "6100";
const VISIBLE = "be.visible";
const DASHBOARD = "/dashboard";
const HAVE_TEXT = "have.text";

const COUNT = /^n: \d+$/;

/**
 * The count on the metric's dashboard card: `n: 2` means two logged values. Matched on its own
 * element, because the card's text runs together ("max: 4200n: 1") and "min: 4200" holds "n: 4".
 */
const cardCount = () =>
  cy
    .contains(METRIC_NAME)
    .parents()
    .filter((_index, element) =>
      Array.from(element.querySelectorAll("span")).some((span) =>
        COUNT.test(span.textContent ?? ""),
      ),
    )
    .first()
    .contains("span", COUNT);

/**
 * From the metric's page: opens the Logs tab, logs a value and waits for it in the list.
 * `atMinute` moves the log to that minute of the current hour.
 */
const logValue = (value: string, atMinute?: string) => {
  cy.contains(TABS, "Logs").click();
  cy.get('button[aria-label="Create New Log"]').click();
  cy.get(DIALOG).within(() => {
    cy.get('input[name="logValue"]').type(value);
  });
  if (atMinute !== undefined) {
    // The picker's popover is rendered outside the dialog.
    cy.get('button[aria-label="Log date and time"]').click();
    cy.get('select[aria-label="Select minute"]').select(atMinute);
    cy.get('button[aria-label="Log date and time"]').click();
  }
  cy.get(`${DIALOG} ${SUBMIT}`).click();

  cy.get(DIALOG).should("not.exist");
  cy.contains(value).should(VISIBLE);
};

const openMetricFromList = () => {
  cy.contains("button", METRIC_NAME).click();
  cy.location("pathname").should("match", /^\/metrics\/[^/]+$/);
};

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

  it("shows the new metric's card on the dashboard at once, with nothing logged", () => {
    cy.visitInTheme(DASHBOARD, THEME);

    cy.contains(METRIC_NAME).should(VISIBLE);
    cardCount().should(HAVE_TEXT, "n: 0");
  });

  it("logs a value, lists it and counts it on the dashboard", () => {
    cy.visitInTheme(METRICS, THEME);
    openMetricFromList();
    cy.location("pathname").then((pathname) => {
      metricPath = pathname;
    });
    cy.get('nav[aria-label="Breadcrumb"] [aria-current="page"]').should(HAVE_TEXT, METRIC_NAME);

    logValue(LOGGED_VALUE);

    // A fresh visit: the page's server prefetch supplies the data whatever the client holds.
    cy.visitInTheme(DASHBOARD, THEME);
    cardCount().should(HAVE_TEXT, "n: 1");
  });

  it("counts a newly logged value when the dashboard is reached with the back button", () => {
    cy.visitInTheme(DASHBOARD, THEME);
    cardCount().should(HAVE_TEXT, "n: 1");

    // The sidebar holds the same link, hidden below the `lg` breakpoint.
    cy.get(`a[href="${METRICS}"]:visible`).click();
    cy.location("pathname").should("eq", METRICS);
    openMetricFromList();
    // The backend keeps one log per timestamp and the form rounds to the minute, so a second value
    // in the same minute is refused with a 409. Minute 30 of this hour is a different timestamp
    // and a different option from the one the picker shows, unless it is minute 30 now.
    logValue(SECOND_VALUE, new Date().getMinutes() === 30 ? "35" : "30");

    // Dashboard, metrics, the metric, its logs tab: three steps back.
    cy.go(-3);
    cy.location("pathname").should("eq", DASHBOARD);
    cardCount().should(HAVE_TEXT, "n: 2");
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
