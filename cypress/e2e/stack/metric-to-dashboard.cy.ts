import { THEMES } from "../../support/a11y";
import { cardCount } from "../../support/dashboard";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The app's core journey: create a metric, see its card on the dashboard, log a value and see it
// in the log list. The 2026-10-04 audit recorded creating a metric and logging a value as not
// covered by any browser test, and until this spec no browser test had opened a metric's own
// page: every other signed-in spec uses a new account, which has no metric.
// Needs the local stack: `npm run test:e2e:stack`.
//
// It asserts the card's count after each change: nothing logged, one value, a second value with the
// dashboard reached through the back button, and the second value deleted, reached the same way.
// It then takes the metric off the dashboard from its settings and puts it back. The counts after a
// log could not be asserted until backend #147, which made the dashboard's ETag follow its body and
// dropped the one-minute browser cache.
//
// The first back-button case checks what the user sees, not the dashboard invalidation in the
// create-log mutation: it passes with that call removed (measured 2026-10-09, no dashboard request
// from the browser). Closing the log dialog refreshes the router (`MetricLogFormDialog`), so going
// back renders the dashboard on the server again and its prefetch supplies the new figures.
// Deleting a log has no dialog and no refresh, so the delete case is the one that needs the
// invalidation: with it removed from the delete-log mutation, the card read `n: 2` (measured
// 2026-10-18).
//
// A value logged today is inside the requested range since backend #163: a relative range ends
// with the current bucket. Before that it was counted here only because the metric is new, and a
// metric with nothing in the range was answered from the range of its latest logs. The case that
// used to fail, a metric with older logs, is `dashboard-counts-today.cy.ts`.
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
const MOBILE_WIDTH = 600;
const MOBILE_HEIGHT = 800;

/** From the metric's page: opens the Logs tab, logs a value and waits for it in the list. */
const logValue = (value: string) => {
  cy.contains(TABS, "Logs").click();
  cy.get('button[aria-label="Create New Log"]').click();
  cy.get(DIALOG).within(() => {
    cy.get('input[name="logValue"]').type(value);
  });
  cy.get(`${DIALOG} ${SUBMIT}`).click();

  cy.get(DIALOG).should("not.exist");
  cy.contains(value).should(VISIBLE);
};

const openMetricFromList = () => {
  cy.contains("button", METRIC_NAME).click();
  cy.location("pathname").should("match", /^\/metrics\/[^/]+$/);
};

/** From the metric's page: sets "Show on Dashboard" in its settings and saves. */
const setShowOnDashboard = (shown: boolean) => {
  cy.contains(TABS, "Settings").click();
  cy.get('button[aria-label="Edit Metric Settings"]').click();
  cy.get(DIALOG).within(() => {
    cy.contains("label", "Show on Dashboard")
      .invoke("attr", "for")
      .then((id) => {
        cy.get(`[id="${id}"]`).then(($switch) => {
          if ($switch.attr("aria-checked") !== String(shown)) cy.wrap($switch).click();
        });
        cy.get(`[id="${id}"]`).should("have.attr", "aria-checked", String(shown));
      });
    cy.get(SUBMIT).click();
  });
  cy.get(DIALOG).should("not.exist");
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
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 0");
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
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 1");
  });

  it("counts a newly logged value when the dashboard is reached with the back button", () => {
    cy.visitInTheme(DASHBOARD, THEME);
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 1");

    // The sidebar holds the same link, hidden below the `lg` breakpoint.
    cy.get(`a[href="${METRICS}"]:visible`).click();
    cy.location("pathname").should("eq", METRICS);
    openMetricFromList();
    // Seconds after the first value, with the time left alone: usually the same minute. The
    // backend keeps one log per exact timestamp, and until the form sent the exact time this was
    // refused with a 409 (audit 2026-10-10, N15).
    logValue(SECOND_VALUE);

    // Dashboard, metrics, the metric, its logs tab: three steps back.
    cy.go(-3);
    cy.location("pathname").should("eq", DASHBOARD);
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 2");
  });

  it("drops a deleted value from the dashboard reached with the back button", () => {
    // Below `sm`, where the log list is cards: the desktop table has no delete control.
    cy.viewport(MOBILE_WIDTH, MOBILE_HEIGHT);
    cy.visitInTheme(DASHBOARD, THEME);
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 2");

    cy.get(`a[href="${METRICS}"]:visible`).click();
    cy.location("pathname").should("eq", METRICS);
    openMetricFromList();
    cy.contains(TABS, "Logs").click();

    cy.contains("li", SECOND_VALUE).within(() => {
      cy.get('button[aria-label="More actions"]').click();
      cy.get('button[aria-label="Delete"]').click();
    });
    cy.contains("li", SECOND_VALUE).should("not.exist");
    cy.contains("li", LOGGED_VALUE).should(VISIBLE);

    // Deleting has no dialog, so nothing refreshes the router: going back restores the dashboard
    // from the router's cache, with the query's cached figures. The dashboard revalidates on every
    // visit, which is what corrects them; the invalidation alone did not in CI (register row F-67).
    cy.go(-3);
    cy.location("pathname").should("eq", DASHBOARD);
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 1");
  });

  it("takes the metric off the dashboard from its settings", () => {
    cy.visitInTheme(metricPath, THEME);
    setShowOnDashboard(false);

    cy.visitInTheme(DASHBOARD, THEME);
    // The account's only metric, so the empty state shows the page loaded without the card.
    cy.contains("No dashboard metrics yet").should(VISIBLE);
    cy.contains(METRIC_NAME).should("not.exist");
  });

  it("puts the metric back on the dashboard from its settings", () => {
    cy.visitInTheme(metricPath, THEME);
    setShowOnDashboard(true);

    cy.visitInTheme(DASHBOARD, THEME);
    cardCount(METRIC_NAME).should(HAVE_TEXT, "n: 1");
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
