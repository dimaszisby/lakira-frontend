# Zero-warning lint gate

**Purpose:** settle the four `react-refresh/only-export-components` warnings left open by
`docs/internal/todos/2026-09-23-todo-clear-lint-warning-backlog.md`, then make `lint` fail on any
new warning.
**Owner:** hardini
**Branch:** `chore/zero-warning-lint-gate` off `dev`

## The decision

The four warnings are the four React Context files in the repo, and each exports exactly a Provider
component and its consumer hook:

| File                                                                                       | Exports                                                         |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `src/app/(app)/metric-categories/[categoryId]/_components/MetricCategoryDetailContext.tsx` | `MetricCategoryDetailProvider`, `useMetricCategoryDetail`       |
| `src/app/(app)/metric-categories/[categoryId]/_components/MetricCategoryReturnContext.tsx` | `MetricCategoryReturnProvider`, `useMetricCategoryReturnParams` |
| `src/app/(app)/metrics/[metricId]/_components/MetricDetailContext.tsx`                     | `MetricDetailProvider`, `useMetricDetail`                       |
| `src/features/organizations/context.tsx`                                                   | `OrganizationProvider`, `useOrganizationId`                     |

**Chosen: turn the rule off for context files only** (`**/*Context.tsx`, `**/context.tsx`), with
the reason next to the override in `eslint.config.mjs`.

**Rejected: split every context into a provider file and a hook file.** It satisfies the rule, but
the rule's only payoff is in the development loop. Per Next 16's own
`node_modules/next/dist/docs/03-architecture/fast-refresh.md`, editing a file with non-component
exports makes Fast Refresh "re-run both that file, and the other files importing it" rather than
updating it in place — not a full page reload. Re-running a context file creates a new context
object, so component state below that provider may reset on edit. That is the whole cost, on four
small files, and splitting would pay for it by doubling the file count and changing the repo's
context convention.

**Rejected: `allowExportNames` listing the four hook names.** Narrower on paper, but every new
context would have to register its hook in `eslint.config.mjs`, and the list would drift from the
files the same way every hand-maintained list here has.

What the override gives up: a non-hook helper added to a context file will not warn. Accepted —
the glob matches only files that are named as contexts.

## Checklist

- [x] Override in `eslint.config.mjs` scoped to the context-file globs, with the reason.
- [x] Confirm the glob matches exactly the four files above and nothing else.
- [x] `lint` runs `eslint . --max-warnings=0`, so a new warning fails the `checks` job in CI and
      `security:lint` (which calls `lint`).
- [x] Prove the gate fails: introduce a warning, watch `npm run lint` exit non-zero, revert.
- [x] Update the docs that describe warnings as non-blocking: `.claude/rules/code-style.md`,
      `.claude/skills/pre-push/SKILL.md`, `docs/reference/commands.md`,
      `docs/how-to/ci-cd/daily-pipeline-playbook.md`, and the stale backlog line in
      `docs/internal/todos/2026-02-16-todo-cicd-overview.md`.
- [x] Tick the open decision in `2026-09-23-todo-clear-lint-warning-backlog.md`, pointing here.

## Discovered

- [x] Found: the override's comment first linked to this todo, which is user-deletable → in scope,
      repointed at `.claude/rules/code-style.md`, which now holds the durable rationale.
- [x] Found: Fast Refresh's cost was first stated as a full page reload → corrected against Next
      16's own docs before anything shipped: it re-runs the file and its importers.
- [x] Found: `docs/how-to/ci-cd/daily-pipeline-playbook.md` ("Coverage gates nothing. Thresholds
      sit at 3/2/3/3 %") and `docs/reference/commands.md` (`coverage:check` "only fails with
      `--strict`, which nothing currently passes") contradict `CLAUDE.md`, which records real
      thresholds and `coverage:check --strict` in CI since 2026-08-27 → out of scope, not fixed here.
      Fixed in #45 (`6c8d215`); checked on `dev` at `144964a`, neither claim remains.

## Verification

| Gate                                 | Result                                                     |
| ------------------------------------ | ---------------------------------------------------------- |
| `lint`                               | 0 errors, **0** warnings (was 4), exit 0                   |
| `lint` discriminates                 | a probe `console.log` fails it, exit 1; reverted           |
| override discriminates               | re-enabling the rule via `--rule` brings the warnings back |
| `lint:css`                           | clean                                                      |
| `typecheck`                          | clean                                                      |
| `format`                             | clean                                                      |
| `test:unit`                          | 80 suites, 669 tests                                       |
| `test:integration`                   | skipped — not triggered, no data access or routing change  |
| `api:spec:check` / `api:types:check` | skipped — not triggered                                    |
| `build`                              | passes                                                     |
| `test:e2e`                           | skipped — not triggered                                    |

## Status

**Complete.** Lint is at zero warnings on this branch and fails on any new one. No runtime code
changed: the diff is `eslint.config.mjs`, one `package.json` script, and docs.

**Not promoted to an ADR.** Both decisions are lint scope, mechanically enforced, with their reason
next to the config and in `.claude/rules/code-style.md`, and neither touches an interface, data
shape, dependency or security boundary. The precedent is `feat/enforce-jsx-a11y` (#43), which made
a whole rule set blocking without a record.
