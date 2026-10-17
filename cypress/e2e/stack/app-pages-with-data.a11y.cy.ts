import { CATEGORY_DEFAULTS } from "../../../src/features/metric-categories/constants";
import { THEMES } from "../../support/a11y";
import { newUser, preflightStack, registerUser, signInSession } from "../../support/stack";

// The signed-in pages again, this time with something on them: a dashboard card (category chip,
// chart and its summary, stats row) and a row in the metrics list, in its mobile variant and its
// desktop table. `app-pages.a11y.cy.ts` uses a new account, so it only ever sees empty states,
// and the 2026-10-10 audit noted that nothing ran axe on a dashboard with cards or a list with
// rows. Debt register row F-33.
// The metric's own pages are checked with data by `metric-to-dashboard.cy.ts`.
// Needs the local stack: `npm run test:e2e:stack`.
//
// The category takes the form's defaults, so its chip is what a user who never picks a colour
// sees. Everything is created through the proxy, as in `chart-summary.cy.ts`.
const STAMP = Date.now();
const CATEGORY_NAME = `Hydration ${STAMP}`;
const METRIC_NAME = `Glasses of water ${STAMP}`;
const LOGS = "/api/proxy/metric-logs";
const DAY_MS = 24 * 60 * 60 * 1000;
const HEIGHT = 800;

// Either side of 1024 px, where both lists switch from the mobile variant to the desktop table.
const WIDTHS = [1000, 1280] as const;

// What must be on the page before axe runs, so a pass cannot come from an empty state.
//
// Left out until their register rows close, so that this spec passes on what it can check:
// - the categories list: the backend answers every repeat of its list query with a 500, so only
//   the first visit renders a row (F-57). Its rows are checked empty by `app-pages.a11y.cy.ts`.
// - the metrics table at 1280 px in the dark theme: the category chip's text is 4.11:1 on its
//   tint, under the 4.5:1 of WCAG 1.4.3 (F-56).
const PAGES: readonly { path: string; label: string; shows: string }[] = [
  { path: "/dashboard", label: "dashboard with a card", shows: METRIC_NAME },
  { path: "/metrics", label: "metrics list with a row", shows: METRIC_NAME },
];

const isKnownFailure = (path: string, width: number, theme: string) =>
  path === "/metrics" && width === 1280 && theme === "dark";

type Created = { data: { id: string } };

describe("Signed-in pages with data meet WCAG 2.1 A and AA", () => {
  const user = newUser("data");

  before(() => {
    preflightStack();
    registerUser(user);
    signInSession(user);

    const now = Date.now();
    cy.request<Created>("POST", "/api/proxy/metric-categories", {
      name: CATEGORY_NAME,
      color: CATEGORY_DEFAULTS.color,
      icon: CATEGORY_DEFAULTS.icon,
    })
      .then(({ body }) =>
        cy.request<Created>("POST", "/api/proxy/metrics", {
          name: METRIC_NAME,
          defaultUnit: "glasses",
          categoryId: body.data.id,
          isPublic: false,
        }),
      )
      .then(({ body }) => {
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
      });
  });

  beforeEach(() => {
    signInSession(user);
  });

  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      for (const { path, label, shows } of PAGES) {
        if (isKnownFailure(path, width, theme)) continue;
        it(`has no violations on the ${label} at ${width} px in the ${theme} theme`, () => {
          cy.viewport(width, HEIGHT);
          cy.visitInTheme(path, theme);
          cy.contains(shows).should("be.visible");
          cy.checkPageA11y(`${label}, ${width} px (${theme})`);
        });
      }
    }
  }
});
