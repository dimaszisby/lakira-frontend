# The remaining P2 findings from the 2026-10-04 re-audit — Decisions

## D-01 — `dompurify` is removed, and raw HTML is banned by lint

> **Promoted to [ADR-0028](../../../explanation/decisions/adr-0028-raw-html-is-banned-by-lint.md)** in the flat
> registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-07

**Context.** `dompurify` is a production dependency that nothing imports (finding N8). Two rule
files say every string reaching `dangerouslySetInnerHTML` goes through it, and nothing in `src`
uses `dangerouslySetInnerHTML` either. So the rule named a library that guards nothing, nothing
checked the rule, and the package still had to be audited: it was one of the three production
advisories on 2026-10-01.

**Decision.** Remove the dependency. Turn on `react/no-danger` as an error, so the app cannot
render raw HTML at all without a visible, reasoned exception. The two rules now say that, and
that an exception brings a sanitiser back with a decision of its own.

**Options considered.**

- _Keep the dependency for the day it is needed._ Rejected: an unused package is audited, updated
  and shipped in the lockfile for nothing, and its presence reads as "this app sanitises HTML".
- _Remove it and keep the written rule._ Rejected: the rule would then name a library that is not
  installed, enforced by nobody. A convention with no mechanism is how the `components` boundary
  went unenforced for months.
- _Remove it and write no rule._ Rejected: the first `dangerouslySetInnerHTML` would arrive with
  no sanitiser and no prompt to add one.

**Consequences.** One fewer production dependency. Rendering HTML from a string now needs a lint
exception, a sanitiser and a decision; that is the intended cost. `react/no-danger` does not see
`innerHTML` assigned through a ref, so the rule files still say not to.

## D-02 — `commands.md` is checked by a unit test, not by a script

- **Status:** Accepted
- **Date:** 2026-10-07

**Context.** `docs/reference/commands.md` said it "is checked against `package.json`", and
nothing checked it (finding N9). `.claude/rules/commands.md` repeats the claim.

**Decision.** A Jest unit test reads both files and fails when a script is missing from the doc,
or the doc names a script that does not exist.

**Options considered.**

- _Change the sentence._ Rejected: the claim is worth making true. The backend's copy of this
  list documented a script that never existed.
- _A `scripts/` checker with its own npm script and CI step._ Rejected: a new script would itself
  need a row in the doc it checks, and a workflow change, for what the unit gate already runs on
  every PR.

**Consequences.** The check lives in the unit suite, where a reader may not look for a docs check;
the doc names the test. It checks names only, not that a description is still true. A script
counts as documented only when its name is in the first cell of a table row: review found that
counting any mention let a deleted row pass wherever the name also appeared in a sentence.

## D-03 — Every mutation that changes what the dashboard shows invalidates it

- **Status:** Superseded by D-04
- **Date:** 2026-10-07

**Context.** `vizKeys.dashboard` had no invalidator, so the dashboard served stale charts for up
to its 60-second `staleTime` after a value was logged. Recorded in the 2026-08-29 and 2026-10-04
audits.

**Decision.** `invalidateDashboardVisualizations(qc, organizationId)` in the feature's `cache.ts`,
called by the metric-log create, update and delete mutations and by the metric create,
create-dummy, update and delete mutations.

**Options considered.**

- _Fold it into `invalidateMetricVisualization`._ Rejected: the metric mutations have no single
  metric's charts to invalidate, and a helper that quietly does two things hides one of them.
- _Log mutations only._ Rejected: a deleted or renamed metric would still sit on the dashboard
  for a minute.
- _A shorter `staleTime`._ Rejected: it refetches on every visit and still shows the old value
  first.

**Consequences.** Each of those seven mutations triggers one more refetch when a dashboard query
is mounted, and none when it is not. The helper matches by key prefix, so it is coupled to the
shape of `vizKeys.dashboard`; a test pins that.

## D-04 — The set is every mutation that writes a field of the dashboard payload

- **Status:** Accepted
- **Date:** 2026-10-07

**Context.** Found in review, after D-03 was implemented. D-03 listed the mutations by what its
author thought of: logs and metrics. The dashboard payload says otherwise. A metric is on the
dashboard only if its settings say `showOnDashboard`, each item carries its `priority`, and each
carries its category's name, colour and icon. So ticking "Show on dashboard" was still not
covered, and that is the action the dashboard's own empty state tells the user to take. D-03 also
said the dashboard was stale "for up to 60 seconds" in general. Read from the code, and not
checked in a browser: on a forward navigation the page's server prefetch already replaces the
client query, so the stale cases are a dashboard that is mounted and one restored by back or
forward.

**Decision.** The rule is the payload, not a list: a mutation calls
`invalidateDashboardVisualizations` if it writes anything the dashboard item carries. Today that
is fifteen mutations:

- metric logs: create, create-dummy, update, delete
- metrics: create, create-dummy, update, delete
- metric settings: create, update, update-display, update-goal, delete
- metric categories: update, delete (not create: no metric belongs to a new category)

**Options considered.**

- _Keep D-03's seven and file the rest._ Rejected: the settings case is the common one, and a fix
  that leaves it out reads as done.
- _Invalidate from one place, such as a mutation-cache listener._ Rejected for this sweep: it is
  a new mechanism for every feature, and an explicit call per hook is what `cache.ts` helpers
  are for here. It is the option to revisit if a sixteenth call site is missed.

**Consequences.** The call is awaited like the invalidations beside it, so when a dashboard query
is mounted the mutation's callback waits for that refetch. No page mounts the dashboard next to
these forms today. `src/features/metrics`, `metric-settings` and `metric-categories` now import
another feature's `cache.ts`, as `metric-logs` already did; `.claude/rules/architecture.md` says
cross-feature imports go through `src/features/shared/` only, which the code did not follow
before this change either. That mismatch is recorded in the checklist, not settled here.
