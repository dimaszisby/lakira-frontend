import { cardCount } from "../../support/dashboard";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// A value logged today, on a metric that already has an older log inside the dashboard's range.
// Until backend #163 the dashboard left it out until the next day: a relative range ended at the
// start of the current day in UTC. `metric-to-dashboard.cy.ts` could not show this, because its
// metric is new on every run and a metric with nothing in the range was answered from the range
// of its latest logs. Debt register row F-10.
// Needs the local stack, on a backend that includes #163: `npm run test:e2e:stack`.
//
// Both values are logged through the proxy, not the form: the form is the journey spec's
// subject, and a value dated yesterday would need the date picker.
const THEME = "light";
const METRIC_NAME = `Glasses of water ${Date.now()}`;
const LOGS = "/api/proxy/metric-logs";
const DAY_MS = 24 * 60 * 60 * 1000;

type CreatedMetric = { data: { id: string } };

describe("A value logged today on a metric with older logs", () => {
  const user = newUser("today");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  beforeEach(() => {
    signInSession(user);
  });

  it("is counted on the dashboard beside yesterday's", () => {
    const now = Date.now();

    cy.request<CreatedMetric>("POST", "/api/proxy/metrics", {
      name: METRIC_NAME,
      defaultUnit: "glasses",
      isPublic: false,
    }).then(({ body }) => {
      const metricId = body.data.id;

      // Twenty-four hours ago is the previous calendar day in every zone, and well inside the
      // dashboard's default range of thirty days.
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
    });

    cy.visitInTheme("/dashboard", THEME);

    cy.contains(METRIC_NAME).should("be.visible");
    cardCount(METRIC_NAME).should("have.text", "n: 2");
  });
});
