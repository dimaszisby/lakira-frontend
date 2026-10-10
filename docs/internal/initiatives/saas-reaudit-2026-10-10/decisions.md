# SaaS re-audit, 2026-10-10 — Decisions

Kit-local `D-NN` entries. Grading calls are added here at the moment they are made, not at the end.

## D-01 — Every gate runs again; the regrade is targeted

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** The 2026-10-04 run regraded all 79 items from the code, because 135 commits separated
it from the run before and that run had published no grade per item. This run follows 33 commits
and ten pull requests, and starts from a table that gives every item a grade and its evidence
(`audit-2026-10-04.md` section 3.1).

**Decision.**

- Every gate, every live probe and the fork test run again, on Node 24.21.0 after a fresh `npm ci`
  in a scratch worktree at `90bc252`.
- An item is **regraded from the code** when it was Partial or Missing on 2026-10-04, or when a
  file its evidence cites appears in `git diff --name-only 07df6c9..90bc252`.
- Every other item is **carried**: its cited `file:line` is re-opened, and the grade stands only
  if the file still says what the grade relies on. A carried item whose evidence has moved is
  regraded.
- Vacuity checks under ADR-003 of the audit kit cover the gates added or tightened since
  2026-10-04. The eight from that run are repeated only where the gate changed.
- The audit's per-item table says which of the three ways each item was graded.

**Options considered.**

- _Regrade all 79 from the code._ Rejected by the owner on 2026-10-10: most of the 67 Pass items
  cite files that no commit has touched since they were graded.
- _Delta only: the gates, the 12 non-Pass items and N1 to N11._ Rejected by the owner: an item
  that regressed in a file one of the ten pull requests touched for another reason would be
  missed.

**Consequences.** A carried grade is only as good as the 2026-10-04 reading of that item. The
table makes that visible instead of presenting 79 fresh grades.

## D-02 — ADR-001 is read as written

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** `audit-2026-10-04.md` section 9 left one question to the owner: leave ADR-001 as
written, or append an ADR that exempts Category 8 (CI/CD) while hosting is undecided. CI/CD is at
67% because there is no deploy job and no deployment configuration (C4).

**Decision.** The owner chose on 2026-10-10 to leave ADR-001 as written. This run reads criterion 3
by the letter, as the last one did (that kit's D-05). No exemption is appended.

**Options considered.**

- _Append an exemption ADR._ Not taken by the owner. It would let the verdict return to FORK-READY
  WITH CAVEATS without deploy configuration existing.
- _Grade by the letter and report the verdict under both readings._ Not taken: the question was
  put and answered, so the audit does not carry it as open again.

**Consequences.** While C4 is open the verdict cannot be reconfirmed, whatever the other twelve
categories show. The audit says so in its first paragraph, so that a closed N2 is not read as the
gate passing.

## D-03 — An independent grader for the items this session's own changes touch

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** The 2026-10-04 run used one grader and no subagents, on the stated ground that its
session had written none of the fixes it graded. That does not hold here. This session wrote #78
(text contrast on the metric detail page and on dark cards), #79 and #80 (the metric journey
spec). #79 and #80 are the evidence for "End-to-end coverage", and #78 is an accessibility change.

**Decision.** One `code-reviewer` subagent grades "End-to-end coverage" (Testing) and the four
Accessibility items. It is given each item's wording, the baseline's definition of Pass, Partial
and Missing, and the repository at `90bc252`. It is not given this session's notes, the pull
request bodies or an expected grade. Where its grade differs from the one the main thread would
have given, its grade stands and the difference is recorded in the audit. The main thread grades
the other 74 items. The owner approved this split on 2026-10-10.

No baseline item is about colour contrast as such, so the whole Accessibility category goes to the
independent grader instead of a single item chosen by the session that made the change.

**Options considered.**

- _One grader, stated plainly._ Not taken by the owner: saying that the grader wrote the change
  does not remove the bias, it only names it.
- _An independent grader for every regraded item._ Not taken by the owner: the fixes for N1 to N11
  were written in other sessions, which is the condition the last run accepted.

**Consequences.** Five grades in the table come from a second grader with less context. Its
evidence is re-opened by the main thread before the audit is written, as acceptance item A-3
requires for every citation, but its grades are not overridden.

## D-04 — The fork bootstrap is Pass, on the steps the script prints

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** On a fresh clone the script runs before `npm ci`, so Prettier is not installed and the
script cannot format the Markdown tables it has just rewritten. In this run `npm run format` exited
1 on five files straight after the bootstrap and `npm ci`. The script's closing steps name
`npm run format:fix` as required, and after it every gate on the fork exited 0.

**Decision.** "Fork bootstrap script" is graded **Pass** and N2 is closed. The item is about a fork
reaching a green first CI run by following the script, and it does.

**Options considered.**

- _Partial, because `format` is still red until a second command is run._ Rejected: the script
  says so in its own output, with the reason, and the verify line it prints includes `format`.
  The 2026-10-04 defect was that nothing said so.

**Consequences.** A forker who skips step 3 of the printed output still gets a red first run. The
audit says so beside the grade.

## D-05 — "Session route validates the token" is graded on what replaced the route

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** The item's evidence was `src/app/api/auth/session/route.ts`, which checked a token the
browser posted to it. #73 deleted that route (ADR-0025): the proxy now takes the token out of the
backend's own response and sets the cookie itself, so the browser never supplies a token to be
stored.

**Decision.** The row keeps its name, so the 79-item table still lines up with earlier runs, and
is graded on the property the item protects: no value the browser chooses becomes the session
cookie. **Pass**, on `src/app/api/proxy/[...path]/route.ts:203-226` and the probe that
`POST /api/auth/session` answers 404.

**Options considered.**

- _Drop the row._ Rejected: the denominator is what makes runs comparable (2026-10-04 kit, D-04).
- _Rename the row._ Rejected for the same reason; the note in the evidence column says what
  changed.

**Consequences.** The row's name describes a route that no longer exists. The evidence column
carries the explanation.

## D-06 — The independent grader's two lower grades stand

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** Under D-03 a `code-reviewer` subagent graded five items. It returned Partial for
"Named accessibility gate in CI" and for "WCAG baseline documented". Both were Pass on 2026-10-04,
and the main thread, carrying them, would have left both at Pass: none of their cited files has
changed. The other three came back as the main thread expected: "End-to-end coverage" Partial,
"`jest-axe` in integration" Pass, "Ariakit-first primitives" Pass.

Its reasons, each re-opened by the main thread and found as stated:

- The CI step is named "Run E2E tests" (`.github/workflows/test.yml:180`), and the baseline failed
  this item because "nothing names a11y as a gate". The browser check in CI covers the eight public
  pages only; every signed-in page is checked by the stack suite, which CI does not run.
- `docs/reference/accessibility-baseline.md` still carries seven "SPECIAL NOTE" placeholders
  (`:48`, `:76`, `:100`, `:195`, `:232`, `:262`, `:302`), and `:332` says the end-to-end checks
  cover "login, dashboard, metrics, main forms", which is true only of a suite outside CI.

**Decision.** Both grades stand, as D-03 said they would. Accessibility is recorded at 50%.

**Options considered.**

- _Keep Pass, as carried._ Rejected: that is the override D-03 ruled out, and the grader's
  evidence is correct.
- _Treat "named gate" as met by the spec's own test titles._ This is the reading the 2026-10-04
  run took. The grader considered it and gave it medium confidence. It does not answer the second
  reason, that no signed-in page is checked in CI.

**Consequences.** Accessibility falls from 100% to 50% with no change in the code it grades: this
is a stricter reading by a second grader, not a regression, and the audit says so in those words.
Accessibility is not one of ADR-001's critical categories, so criterion 3 is not affected.

## D-07 — Forms that print the transport error lower "Errors normalized before display"

- **Status:** Accepted
- **Date:** 2026-10-10

**Context.** On 2026-10-09 the log form answered a backend 409 with "Request failed with status
code 409". The backend had sent "A log entry already exists for this timestamp for this metric".
Four feature forms render the mutation error's own `.message`, which is the Axios text, and never
call `handleApiError`: `LogForm.tsx:135`, `MetricForm.tsx:165`, `MetricSettingsForm.tsx:172` and
`MetricCategoryForm.tsx:129`. The normalization layer itself is intact.

**Decision.** "Error normalization" (API Contract) stays **Pass**. "Errors normalized before
display" (Error Handling & Observability) is lowered to **Partial**, and the defect is finding N12.
This follows the 2026-10-04 kit's D-04: a finding that contradicts a Pass lowers that item.

**Options considered.**

- _Leave both at Pass and list the finding beside the scorecard._ Rejected for the reason given in
  that D-04: the scorecard would report 100% for a category with a reproduced defect in it.
- _Lower both rows._ Rejected: one defect, in the display layer, should not be counted twice.

**Consequences.** Error Handling & Observability goes from 100% to 80%. The four forms predate the
2026-10-04 run, so this is a defect that run did not find, not a regression since it.
