import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// A route that is only a dialog titles that dialog with the page's h1 when it is opened directly,
// and with an h2 when it opens over its list, whose page has the h1 (kit page-headings, D-01,
// ADR-0032). The other dialog routes need a record to open; these two need none.
// Needs the local stack: `npm run test:e2e:stack`.
const DIALOG_ROUTES = [
  {
    list: "/metrics",
    listTitle: "My Metrics",
    open: "Create Metric",
    path: "/metrics/new",
    title: "Add Metric",
  },
  {
    list: "/metric-categories",
    listTitle: "My Categories",
    open: "Create Category",
    path: "/metric-categories/new",
    title: "Add Category",
  },
] as const;

describe("A dialog route has one h1, opened directly or over its list", () => {
  const user = newUser("headings");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  beforeEach(() => {
    signInSession(user);
  });

  for (const { list, listTitle, open, path, title } of DIALOG_ROUTES) {
    it(`titles ${path} with its h1 when opened directly`, () => {
      cy.visit(path);
      cy.get('[role="dialog"]').should("be.visible");
      cy.get("h1").should("have.length", 1).and("have.text", title);
    });

    it(`keeps ${listTitle} as the h1 when ${path} opens over the list`, () => {
      cy.visit(list);
      cy.contains("h1", listTitle).should("be.visible");
      cy.contains("button", open).click();
      cy.location("pathname").should("eq", path);
      cy.get('[role="dialog"] h2').should("have.text", title);
      cy.get("h1").should("have.length", 1).and("have.text", listTitle);
    });
  }
});
