# Frontend debt register

**As of:** 2026-10-18, frontend `dev` at `befc3f8`, with F-08, F-09, F-10, F-14 to F-19, F-21, F-27 to F-29, F-32, F-33, F-35, F-36, F-54 and F-55 closed, and F-34 narrowed to its O-07 item. Ranked by [D-01](decisions.md).

**"What's next" is the first row below whose state is `ready`.** A row above it that is waiting on
someone is reported with it, as a gap. How rows are added and closed:
`.claude/rules/workflow.md` § What's next.

Columns. **Sev** is what the source recorded; `—` means ungraded, and a todo's own "low" is shown
as written. **Owed to** is who is waiting: `verdict` (the audit's FORK-READY verdict), `BE`
(lakira-backend), `fork` (someone forking the template), `us`. **State** is `ready`, `owner`
(waiting on the owner's decision, with its `O-NN` question), `BE` (waiting on the backend),
`upstream` (waiting on a package's maintainers) or `unexplained`.

Sources are abbreviated: `A10 § 6` is `docs/internal/audits/saas-readiness/audit-2026-10-10.md`
§ 6; `FINAL` is `FINAL-AUDIT-SUMMARY.md` in the same folder; `N1` and `N2` are Part 1 and Part 2 of
the Notion page "FE and BE messages"; `B-NN` is a row of the backend's register (lakira-backend
`docs/internal/initiatives/backend-debt-register/register.md`); a bare filename is under
`docs/internal/todos/`. [`SAAS-BASE-CHECKLIST.md`](../../../../SAAS-BASE-CHECKLIST.md) summarises
the same audit and is not a separate source.

## Tier 1 — keeps the audit verdict open

| ID   | Item                                               | Sev | Owed to | State        | Size                 | Source                                                                            | Analysis                                        |
| ---- | -------------------------------------------------- | --- | ------- | ------------ | -------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| F-01 | No deploy job and no deployment configuration (C4) | P1  | verdict | owner (O-01) | ≤1d after the choice | A10 § 3.1 category 8, § 9; FINAL § 8; `2026-08-24-todo-saas-readiness.md` phase 7 | [analysis](analysis-c4-deploy-configuration.md) |

After F-01 merges, a dated audit run is owed: only a run can restate the verdict (ADR-002).

## Tier 2 — P1 or P2 owed to the backend

| ID   | Item                                                                                                | Sev | Owed to | State        | Size | Source                                                                           | Analysis                                             |
| ---- | --------------------------------------------------------------------------------------------------- | --- | ------- | ------------ | ---- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| F-02 | The frontend's preview and production origins are not chosen, so the backend cannot set CORS (B-03) | P2  | BE      | owner (O-01) | —    | N1 "CORS for every frontend origin"; `2026-02-16-todo-cicd-overview.md`          | [analysis](analysis-decisions-owed-between-repos.md) |
| F-03 | The browser's IP is not forwarded through `/api/proxy`, so proxied users share per-IP limits (B-05) | P2  | BE, us  | owner (O-01) | ≤½d  | N2 "Client IP is lost"; `2026-10-02-todo-proxy-client-ip-forwarding.md`; A10 § 7 | [analysis](analysis-client-ip-through-proxy.md)      |

## Tier 3 — P2 security

Both wait on a package's maintainers, and each todo already says what to do when a patch ships, so
neither is analysed ([D-03](decisions.md)).

| ID   | Item                                                                                  | Sev | Owed to | State                        | Size | Source                                                | Analysis |
| ---- | ------------------------------------------------------------------------------------- | --- | ------- | ---------------------------- | ---- | ----------------------------------------------------- | -------- |
| F-04 | The nightly `dependency-audit` is red on `braces`, which has no patched version (N14) | P2  | us      | upstream; revisit 2026-11-03 | ≤1h  | `2026-10-03-todo-braces-dev-advisory.md`; A10 § 6 N14 |          |
| F-05 | `postcss-selector-parser` and `sprintf-js` advisories that no update clears (N14)     | P2  | us      | upstream                     | ≤1h  | `2026-10-11-todo-dev-advisories-without-patch.md`     |          |

## Tier 4 — other P1 and P2

The P1 first, then smaller first.

| ID   | Item                                                                                               | Sev | Owed to | State        | Size | Source                                                                        | Analysis                                             |
| ---- | -------------------------------------------------------------------------------------------------- | --- | ------- | ------------ | ---- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| F-06 | No spec that signs in runs in CI: end-to-end coverage, and the accessibility gate's signed-in half | P1  | us      | owner (O-02) | ≤1d  | A10 § 3.1 categories 7 and 9, § 7, § 9; kit `cypress-a11y-e2e` D-01           | [analysis](analysis-stack-suites-in-ci.md)           |
| F-07 | No `CODE_OF_CONDUCT.md`                                                                            | P2  | fork    | owner (O-03) | ≤1h  | A10 § 3.1 category 13                                                         |                                                      |
| F-11 | The production backend URL is undecided, so production environment config waits (B-04)             | P2  | us      | owner, BE    | —    | N1 "Production backend URL"; `2026-02-16-todo-cicd-overview.md`               | [analysis](analysis-decisions-owed-between-repos.md) |
| F-12 | Field web vitals are logged and nothing aggregates them or compares them with the budget           | P2  | us      | owner (O-01) | ?    | A10 § 3.1 "Field performance data"                                            | [analysis](analysis-field-vitals.md)                 |
| F-13 | No subscription or plan surface                                                                    | P2  | us      | owner (O-10) | ?    | A10 § 3.1 "Subscription or plan surface"; `iteration-plan.md` § P2-only items |                                                      |

## Tier 5 — P3 and ungraded

Listed, not analysed ([D-03](decisions.md)). Between the repos:

| ID   | Item                                                                                                                                                                                | Sev | State                                                   | Source                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------- | ------------------------------------------------------- |
| F-52 | Three Part 1 records stay on the Notion page until they can be archived: the `@sentry/node` 11 note, the `x-request-id` heads-up (B-14), and the acknowledged relative-range record | —   | BE for the first two; the third at the next Notion edit | N1; closed rows F-17 and F-18                           |
| F-57 | The backend answers every repeat of the category list query with a 500, so the categories page shows rows only on its first load                                                    | —   | BE                                                      | `2026-10-17-todo-axe-pages-with-data.md`; Notion Part 1 |
| F-58 | The metrics list reports `logCount: 0` for a metric that has logs                                                                                                                   | —   | BE                                                      | `2026-10-17-todo-axe-pages-with-data.md`                |
| F-59 | The frontend has no smoke steps of its own: the backend's sequence (B-15) runs against the backend, and the same round trip through `/api/proxy` is not written                     | P3  | owner, BE (after F-11)                                  | lakira-backend #171; `release-checklist.md`             |

Security, the proxy and the repository:

| ID   | Item                                                                                                                  | Sev | State                                              | Source                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------- | ------------------------------------------------------------------ |
| F-20 | The proxy forwards upstream error bodies verbatim                                                                     | low | owner (O-06)                                       | `2026-09-20-todo-proxy-forwards-upstream-error-bodies.md`; A10 § 7 |
| F-22 | `console.warn` and `console.log` are not scrubbed; nothing in CI shows that Next still prints through `console.error` | —   | accepted in ADR-0029; one probe for the next audit | `2026-10-10-todo-reaudit-findings.md` (N7, left as found)          |
| F-23 | `next.config.ts` reads `NEXT_PUBLIC_API_BASE_URL` raw, outside the validated environment                              | —   | kept on purpose                                    | `2026-08-24-todo-saas-readiness.md` phase 3                        |
| F-24 | `dev` and `main` have no server-side branch protection                                                                | —   | owner (an action, not code)                        | `2026-08-17-todo-claude-code-setup.md`                             |
| F-25 | `main` shares no history with `dev`                                                                                   | —   | owner (O-08)                                       | `2026-09-24-todo-main-has-unrelated-history.md`                    |
| F-26 | Security follow-ups of 2025-11-26, never triaged: moving protected fetching into Server Components                    | —   | owner                                              | `todo-security-20251126.md`, next cycle, item 2                    |

Errors and forms:

| ID   | Item                                                                                                  | Sev | State            | Source                                                     |
| ---- | ----------------------------------------------------------------------------------------------------- | --- | ---------------- | ---------------------------------------------------------- |
| F-30 | Two entries picked by hand for the same minute are refused; an edit through the picker zeroes seconds | —   | owner (O-05), BE | `2026-10-10-todo-reaudit-findings.md` (N15, left as found) |
| F-31 | In the log form's time picker, choosing minute 0 changed nothing when the current minute was 02       | —   | unexplained      | `2026-10-08-todo-dashboard-count-assertions.md`; A10 § 7   |

Interface, accessibility and end-to-end checks:

| ID   | Item                                                                                                                                                                      | Sev | State        | Source                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| F-56 | The category chip's text is 4.11:1 on its tint in the dark desktop metrics table, under WCAG 1.4.3's 4.5:1                                                                | —   | owner (O-12) | `2026-10-17-todo-axe-pages-with-data.md`                                                                                                 |
| F-34 | The metrics list switches variant at 1024 px in JavaScript and at 640 px in CSS, so a 640 to 1023 px viewport gets cards on `/metrics` and the table in a category's list | —   | owner (O-07) | `2026-10-07-todo-metrics-list-hidden-above-640.md`; its other two items done in #107, `2026-10-17-todo-mobile-lists-breakpoint-class.md` |
| F-37 | Whether the `/metric-logs` lists changed order after backend #125 was never checked                                                                                       | —   | ready        | `2026-09-30-todo-npm-audit-brace-expansion.md`                                                                                           |
| F-48 | Below 1024 px there is no visible way to sign out: nothing opens the mobile drawer, and its Sign Out button is the only one                                               | —   | owner (O-11) | kit `unquarantine-layout-files`, checklist § Discovered                                                                                  |
| F-49 | The closed mobile drawer is moved off screen and not hidden, so its links and Sign Out button stay in the tab order                                                       | —   | with F-48    | same                                                                                                                                     |
| F-50 | No Cypress spec signs out, public or stack                                                                                                                                | —   | ready        | same                                                                                                                                     |
| F-51 | Nothing checks the age of the local backend image before a stack run; twice the suite ran against a backend days behind `dev`                                             | —   | ready        | `2026-10-13-todo-relative-range-includes-today.md` § Discovered; `2026-10-08-todo-dashboard-count-assertions.md`                         |
| F-53 | No `<Toaster>` is mounted, so the sign-out toasts in `AppShell.tsx` show nothing                                                                                          | —   | ready        | `2026-10-14-todo-inline-style-stays.md` § Discovered                                                                                     |

Performance:

| ID   | Item                                                         | Sev | State        | Source                                                    |
| ---- | ------------------------------------------------------------ | --- | ------------ | --------------------------------------------------------- |
| F-38 | The signed-in routes are not under the Lighthouse gate       | —   | owner, BE    | `2026-09-24-todo-authenticated-perf-routes.md`            |
| F-39 | A cold load can paint one frame before the theme script runs | low | owner (O-09) | `2026-09-24-todo-cold-load-paint-before-theme-script.md`  |
| F-40 | The bundle impact of the phosphor migration was not measured | —   | ready        | `2026-09-15-todo-phosphor-icons-migration.md`, "Not done" |

Tests, docs and this register:

| ID   | Item                                                                                         | Sev | State                        | Source                                               |
| ---- | -------------------------------------------------------------------------------------------- | --- | ---------------------------- | ---------------------------------------------------- |
| F-41 | Integration coverage is still being widened; a unit and integration folder split is deferred | P3  | ready; the split is deferred | `2026-02-18-tests-structure-overhaul.md`             |
| F-42 | Two documentation-hygiene items of the CI/CD overview                                        | —   | ready                        | `2026-02-16-todo-cicd-overview.md`                   |
| F-43 | Nothing checks this register against the todo folder                                         | —   | ready                        | this kit, plan § Risks                               |
| F-44 | The dashboard and the metric detail page have no `h1`                                        | —   | ready                        | kit `route-error-boundaries`, checklist § Discovered |
| F-45 | After a successful "Try again", focus falls to the document body                             | —   | ready                        | same                                                 |
| F-46 | `global-error.tsx` still calls `reset`, which does not fetch again                           | —   | ready                        | same; kit D-01                                       |
| F-47 | An error in an intercepted `@modal` route replaces the list under it, not only the dialog    | —   | ready                        | same                                                 |

## Waiting on the owner, not code

| ID   | Question                                                                                                                 | Rows                         | Source                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------- |
| O-01 | Where is the frontend hosted, per environment, and does that host set `X-Forwarded-For`?                                 | F-01, F-02, F-03, F-11, F-12 | A10 § 9; N2; the backend's O-04                           |
| O-02 | Should the stack suites run in CI? The backend repository is public now, which removes one stated cost                   | F-06                         | A10 § 9, item 1                                           |
| O-03 | Which code of conduct text, and which contact address?                                                                   | F-07                         | A10 § 3.1 category 13                                     |
| O-05 | Should two entries picked for the same minute be allowed? That would be a backend change                                 | F-30                         | A10 § 9, item 2; settled for the common case by #88       |
| O-06 | Should the proxy filter upstream error bodies to the keys the frontend reads?                                            | F-20                         | `2026-09-20-todo-proxy-forwards-upstream-error-bodies.md` |
| O-07 | Which list variant should a 640 to 1023 px viewport get: cards or the table?                                             | F-34                         | `2026-10-07-todo-metrics-list-hidden-above-640.md`        |
| O-08 | How does `main` become a release branch: a reset, or a one-time merge?                                                   | F-25                         | `2026-09-24-todo-main-has-unrelated-history.md`           |
| O-09 | Is one cold-load frame worth a second script?                                                                            | F-39                         | `2026-09-24-todo-cold-load-paint-before-theme-script.md`  |
| O-10 | Is a subscription or plan surface in scope for the template? The backend defers its equivalent                           | F-13                         | `iteration-plan.md` § P2-only items                       |
| O-11 | Below 1024 px, where does signing out live: a button that opens the drawer, or a control on the account page?            | F-48, F-49                   | kit `unquarantine-layout-files`, checklist § Discovered   |
| O-12 | How should a category chip tint a user's colour in each theme, so that its text meets 4.5:1 on every surface it sits on? | F-56                         | `2026-10-17-todo-axe-pages-with-data.md`                  |

## Settled just before this register, noted so they are not re-raised

The findings of the 2026-10-10 audit that needed code are closed, each pending a dated run:
N12 (#82), N14 (#83), N7 (#84), N13 (#85), N16 (#86), the two accessibility items (#87) and N15
(#88). The backend's register lists N15 as this side's to raise on the Notion page. #88 settled it
in the form, so there is nothing to raise; what is left of it is F-30.

## Closed

Rows move here when their fix merges, with the PR.

| ID   | Item                                                                                                                     | Closed by | Note                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-08 | Neither route group has an error boundary, and the two route boundaries print `error.message`                            | #90       | Pending a dated run for the audit's "Root error boundary and 404". Kit `route-error-boundaries`.                                                                                                                                                                                                                                                        |
| F-09 | Two layout files are quarantined from the layer rule (C6)                                                                | #91       | Pending a dated run for the audit's "Files quarantined". Kit `unquarantine-layout-files`.                                                                                                                                                                                                                                                               |
| F-10 | A value logged today does not reach the dashboard for a metric with older logs (B-02)                                    | #94       | Backend #163 fixed it; no code here read the values it moved. `dashboard-counts-today.cy.ts` fails on the older backend and passes on the fixed one. Owner question O-04 went with it. `2026-10-13-todo-relative-range-includes-today.md`.                                                                                                              |
| F-14 | The proxy forwards whatever `x-request-id` a browser sends (B-14)                                                        | #92       | The proxy drops the header. The backend's own check is its row B-14; the Notion note is F-17, still open. [Analysis](analysis-x-request-id.md).                                                                                                                                                                                                         |
| F-15 | One spec sync and type regeneration when the backend documents `Set-Cookie` and the 304 (B-13)                           | #97       | Synced with backend #168. The types gain response headers on seven operations, a 304 and `If-None-Match` on the two analytics ones; no body changed. `data-visualizations/api.ts` already sent `If-None-Match` and accepted a 304.                                                                                                                      |
| F-16 | Link the shared pre-production smoke sequence once the backend writes it (B-15)                                          | #105      | lakira-backend #171 wrote it on 2026-10-16; `release-checklist.md` and `backend-handoff.md` § 4 link it, and the Notion record is acknowledged. The frontend's own half through `/api/proxy` is F-59.                                                                                                                                                   |
| F-17 | The `@sentry/node` 11 note was never raised on the Notion page                                                           | #95       | Raised 2026-10-14 as a Part 1 record, with a second record saying the proxy no longer forwards `x-request-id`. The backend's part is its to schedule.                                                                                                                                                                                                   |
| F-18 | The backend's answer of 2026-10-13 on relative ranges is not acknowledged on the Notion page                             | #95       | Acknowledged 2026-10-14 on the record, by then Completed by backend #163, naming #93 and #94. Left on the live page; archiving it is open to either side.                                                                                                                                                                                               |
| F-19 | Two todos say things that are no longer true: an item already raised, stale line numbers, an inference since confirmed   | #95       | Corrected in `2026-10-02-todo-proxy-client-ip-forwarding.md` and `2026-10-08-todo-dashboard-count-assertions.md`, and in `2026-10-04-todo-backend-request-id-unvalidated.md`, which F-17 made stale.                                                                                                                                                    |
| F-21 | `style-src` still allows `'unsafe-inline'`                                                                               | #96       | Decided to keep, not fixed: [ADR-0030](../../../explanation/decisions/adr-0030-inline-style-stays-allowed.md). A unit test now pins what CSS may fetch. `2026-10-14-todo-inline-style-stays.md`.                                                                                                                                                        |
| F-27 | A failed profile load is swallowed into `null`, so the account page cannot say why it failed                             | #100      | `fetchUserProfile` rethrows, and the profile query does not retry a 4xx, so the page names the failure at once. Kit `profile-load-errors`, D-01.                                                                                                                                                                                                        |
| F-28 | Nothing stops the next component from rendering `error.message`; a lint rule could                                       | #101      | Two `no-restricted-syntax` selectors in component files; React Hook Form's field messages stay allowed. A unit test fails if a later config block drops them. A destructured `{ message }` is not caught. `2026-10-16-todo-error-message-lint-rule.md`.                                                                                                 |
| F-29 | In a form with several mutations an old error wins over a newer one                                                      | #102      | The five sites keep their latest action's error in state, cleared when an action starts. Kit `form-shows-latest-error`, D-01.                                                                                                                                                                                                                           |
| F-32 | A chart has no text summary of its values, which the accessibility baseline requires                                     | #103      | `MetricChart` renders a visually hidden summary that its `aria-describedby` points at, on every page that draws a chart. The label by name is F-55. Kit `chart-text-summary`, D-01 and D-02.                                                                                                                                                            |
| F-33 | No suite runs axe on a dashboard with cards or a metrics list with rows                                                  | #104      | `app-pages-with-data.a11y.cy.ts`: the dashboard with a card and the metrics list with a row, both widths and themes, less the two combinations F-56 and F-57 leave out. It found the chart's unnamed canvas, fixed here. `2026-10-17-todo-axe-pages-with-data.md`.                                                                                      |
| F-35 | The dashboard invalidation of #76 has no browser evidence                                                                | #108      | Deleting a log, which has no dialog and so no `router.refresh()`, then going back: `metric-to-dashboard.cy.ts` reads `n: 1`, and `n: 2` with the delete-log mutation's invalidation removed. Shown for that one of the fifteen calls; the rest stay unit-tested. Pending a dated run for A10 § 7. `2026-10-18-todo-dashboard-invalidation-evidence.md`. |
| F-36 | The journey spec does not take a metric off the dashboard and put it back                                                | #108      | The same spec switches "Show on Dashboard" off, sees the dashboard's empty state, and switches it back on. `2026-10-18-todo-dashboard-invalidation-evidence.md`.                                                                                                                                                                                        |
| F-55 | A chart's label names the metric by its id, a UUID, not by its name                                                      | #106      | `MetricChart` and `Visualization` take a required `metricName`, so the label reads `Metric chart for <name>` on the dashboard and the metric page. Kit `chart-text-summary`, D-03.                                                                                                                                                                      |
| F-54 | The policy allows `https://fonts.googleapis.com` and `https://fonts.gstatic.com`, which `next/font` may make unnecessary | #99       | Both removed: `next/font` self-hosts the fonts, and a browser run with the policy enforced loaded both with no violation. [ADR-0031](../../../explanation/decisions/adr-0031-fonts-are-self-hosted.md). `2026-10-16-todo-csp-drop-font-hosts.md`.                                                                                                       |
