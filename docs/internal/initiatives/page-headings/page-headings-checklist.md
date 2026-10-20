# Page headings — Checklist

Register row F-63. `.claude/rules/accessibility.md` § Structure: a page has one `<h1>`. Twelve
pages had none: six auth pages, the categories list, a category's detail page, and four routes
that render only a dialog when opened directly. [D-01](decisions.md) decides the four.

## Auth

- [x] `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailPanel`,
      `AcceptInvitePanel`: every state's `CardTitle` takes `as="h1"`.
- [x] `EmailVerificationNotice` keeps its `h2`: it is a card on the account page, which has its
      own `h1`.

## Content

- [x] `MetricCategoriesPageClient`: `CardTitle as="h1"`, keeping `text-h3`, so it looks the same.
- [x] `MetricCategoryHeaderSection`: the name is an `h1` through `DataLabel`'s `renderValue`, with
      `data-label-text font-sans`, as `MetricHeaderSection` has since F-44.

## Dialogs (D-01)

- [x] `Modal` takes `titleAs?: "h1" | "h2"`, default `"h2"`.
- [x] `MetricForm`, `MetricCategoryForm`, `MetricFormDialog`, `MetricCategoryFormDialog` pass it
      through, same default.
- [x] The four full-page routes pass `"h1"`; their four intercepts render the same component with
      `"h2"` instead of re-exporting it.

## Tests

- [x] One `h1`, by name, in each auth suite's states.
- [x] One `h1` in `MetricCategoriesPageClient.int` and `MetricCategoryHeaderSection.int`.
- [x] `Modal`: `titleAs="h1"` is a level-1 heading; the default is level 2.
- [x] `cypress/e2e/public/auth-pages.a11y.cy.ts`: every public page has exactly one `h1`.
- [x] `cypress/e2e/stack/app-pages.a11y.cy.ts`: every signed-in page has exactly one `h1`, and the
      dialog routes have one whether opened directly or over their list.
- [x] Seen to fail, each restored: with `as="h1"` removed from `LoginForm`, its suite's h1 case
      fails and the public guard fails `/login` in both themes; with the metrics intercept passing
      `"h1"`, only "keeps My Metrics as the h1 when /metrics/new opens over the list" fails.

## Discovered

- [x] Found: closing F-63 failed the register check (D-04 of the register kit), because F-44's
      todo, `2026-10-19-todo-dashboard-metric-detail-h1.md`, left its "Found → F-63" box open on
      purpose and F-63 then moved below Closed → in scope, the box ticked with the PR. Closing a
      row filed from a todo's open box means ticking that box in the same PR.
- [x] Checked, nothing found: a horizontal scrollbar in the 1280 px screenshots. Every signed-in
      page measured `scrollWidth` equal to `clientWidth`; the bar is Electron's, not overflow.

## Acceptance

- **AC-1** — Every page in `src/app` renders exactly one `h1`; the browser guards hold it for the
  public pages, the signed-in pages and the four dialog routes opened directly.
  _Why:_ `accessibility.md` § Structure; WCAG 1.3.1 and 2.4.6 are what heading structure serves.
- **AC-2** — An intercepted dialog over a page adds no second `h1`.
  _Why:_ the page under it already has one (F-44).
- **AC-3** — No title changes how it looks.
  _Why:_ this is structure, not restyling.

How each was checked:

- AC-1 — machine: `auth-pages.a11y.cy.ts` (16 cases) and `app-pages.a11y.cy.ts` assert one `h1`;
  `page-headings.cy.ts` opens `/metrics/new` and `/metric-categories/new` directly; the auth,
  categories and header integration suites assert it per state.
- AC-2 — machine: `page-headings.cy.ts` opens both dialogs over their lists and finds the list's
  `h1` alone, the dialog's title an `h2`.
- AC-3 — by construction and measured: `.card-title` sets size, line height, weight, letter
  spacing and colour, and the base `h1` and `h2` rules differ only in size and line height, so
  the element does not change the auth or categories titles. On the production build: "Login"
  20px/600, "My Categories" 28px/600 (its `text-h3`), a category's name 24px/700 as the metric
  page's; screenshots looked unchanged.

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage
- [x] integration
- [x] build
- [x] e2e and e2e (csp)
- [x] e2e (stack)
