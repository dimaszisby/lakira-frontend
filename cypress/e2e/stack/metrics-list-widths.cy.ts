import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The metrics list has to show its rows at every width, in both list modes. Until 2026-10-07 it
// was blank from 640 px up wherever the page chose its mobile variant: tablets in either mode,
// and desktops in infinite mode. Nothing caught it, because the signed-in specs only ever
// visited the list with a new account, which has no metrics to miss.
// Needs the local stack: `npm run test:e2e:stack`.
const THEME = "light";
const HEIGHT = 800;
const METRIC_NAME = `Width check ${Date.now()}`;

// Either side of the two breakpoints involved: Tailwind's `sm` at 640 px, which the list's CSS
// uses, and 1024 px, where the page switches variant in JavaScript.
const WIDTHS = [600, 800, 1000, 1280] as const;
const MODES = [
  { mode: "pages", label: "paginated" },
  { mode: "scroll", label: "infinite" },
] as const;

describe("The metrics list at every width", () => {
  const user = newUser("widths");

  before(() => {
    preflightStack();
    registerUser(user);
  });

  beforeEach(() => {
    signInSession(user);
  });

  it("has a metric to show", () => {
    cy.request("POST", "/api/proxy/metrics", {
      name: METRIC_NAME,
      defaultUnit: "steps",
      isPublic: false,
    })
      .its("status")
      .should("be.oneOf", [200, 201]);
  });

  for (const width of WIDTHS) {
    for (const { mode, label } of MODES) {
      it(`shows the metric at ${width} px in ${label} mode`, () => {
        cy.viewport(width, HEIGHT);
        cy.visitInTheme(`/metrics?mode=${mode}`, THEME);

        cy.contains(METRIC_NAME).should("be.visible");
      });
    }
  }
});
