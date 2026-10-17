import { CATEGORY_DEFAULTS } from "../../../src/features/metric-categories/constants";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The metrics list has to show its rows at every width, in both list modes. Until 2026-10-07 it
// was blank from 640 px up wherever the page chose its mobile variant: tablets in either mode,
// and desktops in infinite mode. Nothing caught it, because the signed-in specs only ever
// visited the list with a new account, which has no metrics to miss.
// A category's own metric list renders the same table, with the mobile variant in infinite mode,
// so it is checked the same way; the metric is created in a category for that.
// Needs the local stack: `npm run test:e2e:stack`.
const THEME = "light";
const HEIGHT = 800;
const STAMP = Date.now();
const METRIC_NAME = `Width check ${STAMP}`;
const CATEGORY_NAME = `Width category ${STAMP}`;

// Either side of the two breakpoints involved: Tailwind's `sm` at 640 px, which the list's CSS
// uses, and 1024 px, where the page switches variant in JavaScript.
const WIDTHS = [600, 800, 1000, 1280] as const;
const MODES = [
  { mode: "pages", label: "paginated" },
  { mode: "scroll", label: "infinite" },
] as const;

type Created = { data: { id: string } };

// `cy.contains` yields the first match in the DOM. A category's paginated list renders both
// variants and lets CSS hide one, so the first match can be the hidden copy. This takes the
// innermost elements holding the text and asserts that one of them is visible.
const shouldShow = (text: string) =>
  cy
    .get(`body :contains("${text}"):not(:has(:contains("${text}")))`)
    .filter(":visible")
    .should("have.length.at.least", 1);

describe("The metrics list at every width", () => {
  const user = newUser("widths");
  let categoryId = "";

  before(() => {
    preflightStack();
    registerUser(user);
  });

  beforeEach(() => {
    signInSession(user);
  });

  it("has a metric to show, in a category", () => {
    cy.request<Created>("POST", "/api/proxy/metric-categories", {
      name: CATEGORY_NAME,
      color: CATEGORY_DEFAULTS.color,
      icon: CATEGORY_DEFAULTS.icon,
    })
      .then(({ body }) => {
        categoryId = body.data.id;
        return cy.request("POST", "/api/proxy/metrics", {
          name: METRIC_NAME,
          defaultUnit: "steps",
          categoryId,
          isPublic: false,
        });
      })
      .its("status")
      .should("be.oneOf", [200, 201]);
  });

  for (const width of WIDTHS) {
    for (const { mode, label } of MODES) {
      it(`shows the metric at ${width} px in ${label} mode`, () => {
        cy.viewport(width, HEIGHT);
        cy.visitInTheme(`/metrics?mode=${mode}`, THEME);

        shouldShow(METRIC_NAME);
      });

      it(`shows the metric in its category at ${width} px in ${label} mode`, () => {
        cy.viewport(width, HEIGHT);
        cy.visitInTheme(`/metric-categories/${categoryId}?mode=${mode}`, THEME);

        shouldShow(METRIC_NAME);
      });
    }
  }
});
