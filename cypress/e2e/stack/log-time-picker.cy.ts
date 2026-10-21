import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The log form's time picker, at a minute between its 5-minute steps (register row F-31). Its
// minute list showed the nearest step, "00" at 9:02, so choosing "00" picked the option already
// selected; a browser fires no change for that, and the time stayed 9:02. jsdom fires one
// regardless, which is why this runs in a real browser.
//
// Only `Date` is frozen, at minute 02 of the current hour, and only once the metric exists: the
// form's default time is `new Date()`. Timers run normally.
// Needs the local stack: `npm run test:e2e:stack`.
const THEME = "light";
const METRICS = "/metrics";
const DIALOG = '[role="dialog"]';
const SUBMIT = 'button[type="submit"]';
const TABS = 'nav[aria-label="Metric tabs"] a';
const METRIC_NAME = `Picker minutes ${Date.now()}`;
const MINUTE = 'select[aria-label="Select minute"]';

/** Minute 02 of the current hour, so the form opens between two steps. */
const atMinuteTwo = () => {
  const date = new Date();
  date.setMinutes(2, 0, 0);
  return date.getTime();
};

describe("The log form's time picker between two minute steps", () => {
  const user = newUser("picker");
  let metricPath = "";

  before(() => {
    preflightStack();
    registerUser(user);
    signInSession(user);

    cy.visitInTheme(METRICS, THEME);
    cy.get('button[aria-label="Create Metric"]').click();
    cy.get(DIALOG).within(() => {
      cy.get('input[name="name"]').type(METRIC_NAME);
      cy.get('input[name="defaultUnit"]').type("steps");
      cy.get(SUBMIT).click();
    });
    cy.get(DIALOG).should("not.exist");
    // The table from 640 px, the cards below it; both render (ADR-0035), so the visible one.
    cy.get(`button[aria-label="Open metric ${METRIC_NAME}"], tr:contains("${METRIC_NAME}")`)
      .filter(":visible")
      .click();
    cy.location("pathname")
      .should("match", /^\/metrics\/[^/]+$/)
      .then((pathname) => {
        metricPath = pathname;
      });
  });

  beforeEach(() => {
    signInSession(user);
    cy.clock(atMinuteTwo(), ["Date"]);
    cy.visitInTheme(metricPath, THEME);
    cy.contains(TABS, "Logs").click();
    cy.get('button[aria-label="Create New Log"]').click();
    cy.get(`${DIALOG} button.picker-trigger`).as("trigger").should("contain.text", ":02");
    cy.get("@trigger").click();
  });

  it("lists the time's own minute, not the nearest step", () => {
    cy.get(MINUTE).find("option:selected").should("have.text", "02");
    cy.get(MINUTE).find("option").first().should("have.text", "00");
  });

  it("moves the time to 00 when 00 is chosen", () => {
    cy.get(MINUTE).select("00");

    cy.get("@trigger").should("contain.text", ":00").and("not.contain.text", ":02");
  });
});
