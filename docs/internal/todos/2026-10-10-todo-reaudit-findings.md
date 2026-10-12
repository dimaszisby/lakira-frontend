# 2026-10-10 - Todo: findings of the 2026-10-10 re-audit

**Context:** the P2 findings of
[`audit-2026-10-10.md`](../audits/saas-readiness/audit-2026-10-10.md) that need a change in this
repository. None blocks the verdict; that waits on deploy configuration (C4). Each is its own
branch when picked up.

## Checklist

- [x] **N12** — four forms print the transport error, not the server's message:
      `LogForm.tsx:135`, `MetricForm.tsx:165`, `MetricSettingsForm.tsx:172`,
      `MetricCategoryForm.tsx:129`. Render what `handleApiError` returns, as the sign-in forms do,
      with a test per form that mocks a 409 carrying a message. Returns "Errors normalized before
      display" to Pass
- [x] **N7, what is left** — Next prints a Server Component's error to stdout itself, unscrubbed,
      on the line before the application's scrubbed one. Find out whether Next lets that line be
      replaced or silenced; if not, say so in ADR-0027's consequences and in `SECURITY.md`
- [x] **N13** — `src/lib/__tests__/csp.test.ts:127-136` fails when `NEXT_PUBLIC_API_BASE_URL` is
      exported in the shell. Make the test set or clear the variable itself
- [x] **N14** — the development-only audit reports six advisories; only `braces` has a todo.
      `handlebars` (critical, through `ts-jest`), `postcss-selector-parser` and `sprintf-js` need
      the same treatment: trace, update where a patch exists, record the rest
- [x] **N15** — a second value logged in the same minute is refused with a 409. Decide whether the
      form should stop rounding to the minute or the backend should allow it; if the backend, raise
      it on the shared Notion page
- [x] **N16** — three statements that no longer hold: `.claude/rules/testing.md:22` ("Cypress 14"),
      `.claude/rules/accessibility.md:82` ("all 19 integration suites"),
      `docs/reference/accessibility-baseline.md:332` (which pages the end-to-end checks cover)
- [x] **Accessibility, two items at Partial** — name the accessibility check as its own step in
      `.github/workflows/test.yml`, and resolve or remove the seven "SPECIAL NOTE" placeholders in
      `docs/reference/accessibility-baseline.md`. The signed-in pages stay outside CI until the
      stack suites run there, which is an owner decision (audit section 9)

## Not here

- The two deploy items (P1): phase 7 of
  [`iteration-plan.md`](../audits/saas-readiness/iteration-plan.md), waiting on hosting.
- Running the stack suites in CI (P1, "End-to-end coverage"): an owner decision first.
- `CODE_OF_CONDUCT.md`, the subscription surface, field vitals, route-group error boundaries and
  the two quarantined files: carried from earlier runs, unchanged.

## Status

**N12: done 2026-10-10 on `fix/forms-show-server-error`.** Node 24.21.0, production build, local
backend on `a6ab1dc`. N14, N7, N13, N16, the two accessibility items and N15 are done too; see the
later entries in this section. Nothing in the checklist is open.

The owner chose to fix every site of the defect, not only the four forms the audit named. Eight
sites now render `handleApiError(error)`, the line the sign-in forms already used:

| Site                             | Test that fails without the fix                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `LogForm.tsx`                    | `LogForm.int.test.tsx`, "shows the server's message when creating a log is refused"                                             |
| `MetricForm.tsx`                 | `MetricForm.int.test.tsx`, "… when saving a metric is refused"                                                                  |
| `MetricSettingsForm.tsx`         | `MetricSettingsForm.int.test.tsx`, "… when creating settings is refused"                                                        |
| `MetricCategoryForm.tsx`         | `MetricCategoryForm.int.test.tsx`, "… when creating a category is refused"; and the unit test below                             |
| `MetricsPageClient.tsx`          | `MetricsPageClient.int.test.tsx`, "… when deleting a metric is refused"                                                         |
| `DashboardContent.tsx`           | `DashboardContent.int.test.tsx`, "shows error state when dashboard request fails", which now also asserts the server's sentence |
| `MetricCategoriesPageClient.tsx` | none. Its only error is from the dummy-create action, which is off unless `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` is set             |
| `src/app/(app)/account/page.tsx` | none. `fetchUserProfile` returns `null` instead of throwing, so the line is not reached by a failed request                     |

- Each of the six new assertions was run against the unfixed code first and failed there: four
  form cases in one run, the page and dashboard cases in a second.
- Two existing assertions changed with the behaviour. `LogForm.int.test.tsx` expected "request
  failed with status code 500" and now expects the 5xx copy. `MetricCategoryForm.test.tsx` handed
  the form a plain `new Error("Create category failed")` and expected that text; a plain error with
  no response now reads as a connection problem, so the test builds the Axios 409 the API layer
  really throws. The owner approved that change on 2026-10-10.
- In a browser, through the proxy: two values logged in the same minute. The dialog read "A log
  entry already exists for this timestamp for this metric". Before, it read "Request failed with
  status code 409".
- Reviewed by a `code-reviewer` subagent: nothing critical, nothing at warning level.

What the user sees now: a 4xx shows the server's message; a 5xx shows "Something went wrong on our
side. Please try again later."; no response shows "We couldn't reach the server. Check your
connection and try again."

Left as found:

- [ ] Found: the two route-level boundaries, `metrics/[metricId]/error.tsx:24` and
      `dashboard/error.tsx:23`, print `error.message`. They receive Next's error, not an API error
      → out of scope.
- [ ] Found: a failed profile load is swallowed into `data: null` by `fetchUserProfile`, by
      design, so the account page cannot say why it failed → out of scope.
- [ ] Found: nothing stops the next component from rendering `error.message`. A lint rule could →
      out of scope; the rule is now written in `.claude/rules/data-access.md`.
- [ ] Found: in a form with several mutations, an old create or update error still wins over a
      newer delete error, as before this change → out of scope.

**N14: done 2026-10-11 on `chore/dev-advisories-n14`.** Node 24.21.0, npm 11.19.0. Each of the four
packages was traced; one had a patch.

| Package                   | Outcome                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handlebars`              | Updated, 4.7.9 to 4.7.10, with `npm update handlebars`. One lockfile entry changed; `package.json` did not                                                 |
| `postcss-selector-parser` | No update possible under `tailwindcss` 3. Recorded in [`2026-10-11-todo-dev-advisories-without-patch.md`](2026-10-11-todo-dev-advisories-without-patch.md) |
| `sprintf-js`              | No patched version exists. Recorded in the same file                                                                                                       |
| `braces`                  | No patched version exists. Already tracked in [`2026-10-03-todo-braces-dev-advisory.md`](2026-10-03-todo-braces-dev-advisory.md)                           |

- `npm audit` before: 55 packages reported (1 critical, 47 high, 7 moderate). After: 54 (0
  critical, 47 high, 7 moderate). `handlebars` was the one critical package and is gone from the
  report; nothing new appeared.
- `npm audit fix` was not used: it would have moved packages that have nothing to do with these
  advisories.
- The nightly `dependency-audit` job stays red. All 47 high reports trace to `braces`, which has no
  patch, and the owner's decision of 2026-10-03 to leave it red stands.

**N7, what is left: done 2026-10-11 on `fix/scrub-next-error-line`.** Node 24.21.0, production
build, `SENTRY_DSN` empty.

The answer to the todo's question: Next 16.3.8 has no setting for that line under `next start`. It
prints the error with `console.error` after calling the application's `onRequestError`
(`next/dist/server/next-server.js`, `instrumentationOnRequestError`), and skips it only when the
server's `quiet` option is set, which exists only on a custom server. The owner chose to scrub
`console.error` over documenting the gap or moving to a custom server.
[ADR-0029](../../explanation/decisions/adr-0029-the-servers-console-error-output-is-scrubbed.md)
records the decision and its limits.

- `scrubConsoleErrors` (`src/lib/monitoring/console-scrub.ts`) wraps `console.error` in the server
  process, in production, once. `register()` in `src/instrumentation.ts` calls it first.
- The probe, a temporary page that threw the audit's message, deleted afterwards. Before the
  change, Next's line on stderr carried the address, the `token=` value and the bearer value, as
  in the audit. After it, the line read as below, and neither stream held any of the three values.
  The application's `server.request_error` line was present and scrubbed in both runs.

  ```
  ⨯ Error: audit probe failed for [email] at /reset with Bearer [redacted]
  ```

- The line is on stderr. The audit called it stdout.
- Eight unit cases for the wrapper and two for `register()`. Against a wrapper that did nothing,
  three of the first five failed; the other two assert what a no-op also satisfies (the thrown
  error is untouched; nothing is wrapped outside production).
- Reviewed by a `code-reviewer` subagent: nothing critical. Its three warnings were acted on. The
  wrapper now prints a placeholder when an argument throws while it is formatted, where it would
  have thrown into the code that was logging. Three cases were added (a format string, a line past
  the limit, a throwing argument). The cut-before-scrub limit on a long line is accepted and
  stated in the ADR.

Left as found:

- [ ] Found: `console.warn`, `console.log` and a dependency that writes to the streams directly
      are not scrubbed → out of scope; stated in ADR-0029 and `SECURITY.md`.
- [ ] Found: nothing in CI shows whether a later Next still prints through `console.error`. The
      check is the probe above, by hand → out of scope; a candidate for the next dated audit's
      probe list.

**N13: done 2026-10-11 on `fix/csp-test-own-env`.** Node 24.21.0. One file changed,
`src/lib/__tests__/csp.test.ts`; no source file did.

- Reproduced first on `dev` at `98a7316`. With `NEXT_PUBLIC_API_BASE_URL` exported, "matches the
  page policy in every directive except script-src" failed: expected `'self'`, received
  `'self' http://localhost:8001`. Without it, all 12 cases passed.
- The cause: the test imported `next.config.ts` at the top of the file, and that file reads the
  variable once, on import. The test now loads it under `jest.isolateModules` with the variable
  set or cleared by the case, the pattern `src/lib/__tests__/env.test.ts` uses, and restores the
  environment afterwards.
- One case is new: with an API origin configured, the static policy matches the page policy in
  every directive except `script-src`, and `connect-src` carries the origin. Nothing tested that
  shape before. It was run once against a page policy built with no origin and failed on
  `connect-src`, so it can fail.
- The unit gate passes both ways now: 954 tests with the variable unset, 954 with it exported.

**N16: done 2026-10-12 on `docs/reaudit-n16-stale-statements`.** Each statement was checked against
the repository before it was rewritten.

| File                                       | Said                                                  | Now says                                                                           |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `.claude/rules/testing.md`                 | "Cypress 14"                                          | "Cypress 15". `package.json` has `^15.21.0`                                        |
| `.claude/rules/accessibility.md`           | "all 19 integration suites"                           | "every integration suite". There are 22 and all 22 carry `toHaveNoViolations`      |
| `docs/reference/accessibility-baseline.md` | E2E checks on "login, dashboard, metrics, main forms" | The eight public pages in CI; the five signed-in pages by the stack suite, locally |

- The count was dropped, not raised to 22: a written-out count is right once and wrong after the
  next suite is added.
- Left as written: `adr-0017` and `adr-0018` each say "19" suites. Both are dated statements in
  immutable records, true when written.
- No other live copy of either statement exists outside `docs/internal/` and those two records.

**Accessibility, two items: done 2026-10-12 on `chore/a11y-named-ci-step`.** Node 24.21.0,
production build.

The named step. The owner chose to split the run, over running the check twice or renaming the
shared step.

| Script            | Runs                                                 | Result, this branch |
| ----------------- | ---------------------------------------------------- | ------------------- |
| `test:e2e:public` | `cypress/e2e/public/` without `*.a11y.cy.ts`         | 2 specs, 2 tests    |
| `test:e2e:a11y`   | `cypress/e2e/public/**/*.a11y.cy.ts`                 | 1 spec, 16 tests    |
| `test:e2e`        | the two above, in turn; what it ran before the split | 3 specs, 18 tests   |

- CI's `e2e` job runs the first two as separate steps. The new one is named "Run accessibility
  checks on the public pages (axe, WCAG 2.1 A and AA)".
- The split is by filename: `excludeSpecPattern` keeps `*.a11y.cy.ts` out of `test:e2e:public`, so
  a new public spec lands in the right step with no list to edit.
- No ADR: no interface, dependency or security boundary changed.
- The signed-in pages are still checked only by `npm run test:e2e:stack`, outside CI. A later audit
  may keep this item at Partial for that reason.

The baseline. All seven "SPECIAL NOTE" placeholders in `docs/reference/accessibility-baseline.md`
are replaced by the fact each asked for, checked against the code: where `<main>` comes from, the
`sr-only` class, the focus tokens, the palette and how contrast is checked, the navigation
components, the chart wrapper, and the breakpoints. Two stale phrases in the same sections were
corrected: "`/app`" for the routes, and a headless library "if adopted later" (Ariakit is in use).

Left as found:

- [ ] Found: the baseline says a chart must have a text summary of its values. `MetricChart.tsx`
      gives the chart a role and a label and renders no summary. Whether each page that shows a
      chart provides one was not checked → out of scope; a candidate for the next audit.

**N15: done 2026-10-13 on `fix/log-keeps-exact-time`.** Node 24.21.0, production build, local
backend and Mailpit.

The owner chose the form over the backend. The backend refuses a log only at the exact timestamp of
another log for the same metric (`CreateMetricLog.ts`, `existsAtTimestamp`, backend `origin/dev`),
which stops a form submitted twice from saving two entries. The form made that "one per minute" by
rounding the time before sending it. The backend's rule stays.

- `toISOZExact` (`src/utils/date-io.ts`) serializes without rounding. `LogForm.tsx` uses it for
  both requests. `toISOZ` is unchanged: the metric settings use it for start and deadline dates.

| Case                             | Before                                              | After                                   |
| -------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Add, time left as it is          | rounded to the minute; a second log there got a 409 | sent to the millisecond; both are saved |
| Edit, time left as it is         | the log's time rounded to the minute on every save  | the log's time is unchanged             |
| Add or edit, time picked by hand | seconds are zero                                    | the same: the picker only has minutes   |

- Two integration cases, both failing against the unfixed form: one freezes the clock and expects
  that instant in the request (received `…:00.000Z`), one edits only the value of a log stored at
  `08:00:37.250Z` and expects that time back (received `08:00:00.000Z`).
- In a browser: `metric-to-dashboard.cy.ts` no longer moves its second log to another minute.
  Against a build of the unfixed code the dialog stayed open and the case failed; against the fix
  the stack suite passes, 28 of 28. The two logs are seconds apart, so they usually share a minute;
  the integration cases are what pin the behaviour.
- Reviewed by a `code-reviewer` subagent: nothing critical, nothing at warning level. One note was
  acted on: the first integration case claimed millisecond precision and only compared against the
  clock, so it now freezes the clock and expects the exact instant.

Left as found:

- [ ] Found: two entries picked by hand for the same minute are still refused, with the server's
      sentence in the dialog. Allowing them is a backend decision -> out of scope.
- [ ] Found: an edit that changes the time through the picker sets that log's seconds to zero ->
      out of scope; the picker has no seconds.
