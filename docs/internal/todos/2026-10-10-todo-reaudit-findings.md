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
- [ ] **N7, what is left** — Next prints a Server Component's error to stdout itself, unscrubbed,
      on the line before the application's scrubbed one. Find out whether Next lets that line be
      replaced or silenced; if not, say so in ADR-0027's consequences and in `SECURITY.md`
- [ ] **N13** — `src/lib/__tests__/csp.test.ts:127-136` fails when `NEXT_PUBLIC_API_BASE_URL` is
      exported in the shell. Make the test set or clear the variable itself
- [ ] **N14** — the development-only audit reports six advisories; only `braces` has a todo.
      `handlebars` (critical, through `ts-jest`), `postcss-selector-parser` and `sprintf-js` need
      the same treatment: trace, update where a patch exists, record the rest
- [ ] **N15** — a second value logged in the same minute is refused with a 409. Decide whether the
      form should stop rounding to the minute or the backend should allow it; if the backend, raise
      it on the shared Notion page
- [ ] **N16** — three statements that no longer hold: `.claude/rules/testing.md:22` ("Cypress 14"),
      `.claude/rules/accessibility.md:82` ("all 19 integration suites"),
      `docs/reference/accessibility-baseline.md:332` (which pages the end-to-end checks cover)
- [ ] **Accessibility, two items at Partial** — name the accessibility check as its own step in
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
backend on `a6ab1dc`. The other items are open.

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
