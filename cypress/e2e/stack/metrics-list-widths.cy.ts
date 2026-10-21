import { CATEGORY_DEFAULTS } from "../../../src/features/metric-categories/constants";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The metrics list has to show its rows at every width, in both list modes. Until 2026-10-07 it
// was blank from 640 px up wherever the page chose its mobile variant: tablets in either mode,
// and desktops in infinite mode. Nothing caught it, because the signed-in specs only ever
// visited the list with a new account, which has no metrics to miss.
// A category's own metric list renders the same table, with the mobile variant in infinite mode,
// so it is checked the same way; the metric is created in a category for that.
// In paginated mode every list shows the table from 640 px and the cards below it, switched by CSS
// at `sm` alone (ADR-0035, register row F-34). `/metrics` used to switch in JavaScript at 1024 px,
// so a tablet got cards there and the table in a category's list; the categories page showed its
// sort chips below 1024 px, beside its table. Both are checked here, the categories list included.
// Needs the local stack: `npm run test:e2e:stack`.
const THEME = "light";
const HEIGHT = 800;
const STAMP = Date.now();
const METRIC_NAME = `Width check ${STAMP}`;
const CATEGORY_NAME = `Width category ${STAMP}`;

// Either side of Tailwind's `sm` at 640 px, where the lists switch, and of `lg` at 1024 px, where
// the shell does and where `/metrics` used to switch its list.
const WIDTHS = [600, 800, 1000, 1280] as const;
const SM = 640;
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

const CHIPS = '[role="group"][aria-label="Sort options"]';

// Not shown means hidden or not rendered: an element JavaScript chose not to render is as absent
// to the user as one CSS hides, and `should("not.be.visible")` fails on an element that is absent.
const shouldBeShown = (selector: string, shown: boolean) =>
  shown
    ? cy.get(selector).should("be.visible")
    : cy.get("body").should(($body) => {
        expect($body.find(selector).filter(":visible"), selector).to.have.length(0);
      });

/** The table from 640 px, the cards below it, and the cards' sort chips with them when a page has some. */
const shouldShowVariantFor = (
  width: number,
  { table, cards, chips }: { table: string; cards: string; chips: boolean },
) => {
  const isTable = width >= SM;
  shouldBeShown(`[aria-label="${table}"]`, isTable);
  shouldBeShown(`[aria-label="${cards}"]`, !isTable);
  if (chips) shouldBeShown(CHIPS, !isTable);
};

const METRIC_VARIANTS = { table: "Metrics table", cards: "Metrics mobile list" };
const CATEGORY_VARIANTS = {
  table: "Metric categories table",
  cards: "Metric categories mobile list",
  chips: true,
};

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
        if (mode === "pages") shouldShowVariantFor(width, { ...METRIC_VARIANTS, chips: true });
      });

      it(`shows the metric in its category at ${width} px in ${label} mode`, () => {
        cy.viewport(width, HEIGHT);
        cy.visitInTheme(`/metric-categories/${categoryId}?mode=${mode}`, THEME);

        shouldShow(METRIC_NAME);
        if (mode === "pages") shouldShowVariantFor(width, { ...METRIC_VARIANTS, chips: false });
      });

      // The categories list switches in CSS in both modes; only its chips were out of step.
      it(`shows the category at ${width} px in ${label} mode`, () => {
        cy.viewport(width, HEIGHT);
        cy.visitInTheme(`/metric-categories?mode=${mode}`, THEME);

        shouldShow(CATEGORY_NAME);
        shouldShowVariantFor(width, CATEGORY_VARIANTS);
      });
    }
  }
});
