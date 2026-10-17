import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// Every metric chart carries a text summary of its values, which a screen reader reaches through
// the chart's aria-describedby (docs/reference/accessibility-baseline.md § 7.3). The figures are
// the real backend's, on the two pages that draw a chart. The metric page has no Jest suite that
// renders the real chart, so this spec is its proof. Debt register row F-32.
// Needs the local stack: `npm run test:e2e:stack`.
//
// Both values are logged through the proxy, as in `dashboard-counts-today.cy.ts`.
const THEME = "light";
const METRIC_NAME = `Cups of tea ${Date.now()}`;
const LOGS = "/api/proxy/metric-logs";
const DAY_MS = 24 * 60 * 60 * 1000;
const FIGURES = "average 7 cups, minimum 6 cups, maximum 8 cups, from 2 logs.";

type CreatedMetric = { data: { id: string } };

// The chart of one metric, found by its label, and the text its aria-describedby points at.
const chartSummary = (metricName: string) =>
  cy
    .get(`[role="img"][aria-label="Metric chart for ${metricName}"]`)
    .should("have.attr", "aria-describedby")
    .then((summaryId) => cy.get(`[id="${String(summaryId)}"]`));

describe("A metric chart's text summary", () => {
  const user = newUser("summary");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  beforeEach(() => {
    signInSession(user);
  });

  it("gives the backend's figures on the dashboard and on the metric page", () => {
    const now = Date.now();

    cy.request<CreatedMetric>("POST", "/api/proxy/metrics", {
      name: METRIC_NAME,
      defaultUnit: "cups",
      isPublic: false,
    }).then(({ body }) => {
      const metricId = body.data.id;

      cy.request("POST", LOGS, {
        metricId,
        type: "manual",
        logValue: 6,
        loggedAt: new Date(now - DAY_MS).toISOString(),
      });
      cy.request("POST", LOGS, {
        metricId,
        type: "manual",
        logValue: 8,
        loggedAt: new Date(now).toISOString(),
      });

      cy.visitInTheme("/dashboard", THEME);
      cy.contains(METRIC_NAME).should("be.visible");
      chartSummary(METRIC_NAME).should("contain.text", FIGURES);

      cy.visitInTheme(`/metrics/${metricId}`, THEME);
      chartSummary(METRIC_NAME).should("contain.text", FIGURES);
    });
  });
});
