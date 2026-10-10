# 2026-10-10 - Todo: findings of the 2026-10-10 re-audit

**Context:** the P2 findings of
[`audit-2026-10-10.md`](../audits/saas-readiness/audit-2026-10-10.md) that need a change in this
repository. None blocks the verdict; that waits on deploy configuration (C4). Each is its own
branch when picked up.

## Checklist

- [ ] **N12** — four forms print the transport error, not the server's message:
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
