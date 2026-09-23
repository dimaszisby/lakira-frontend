# Clear the lint warning backlog

**Purpose:** ticket #9 from the UI-refactor follow-ups — pre-existing warnings that keep riding
along with `eslint --fix` and getting reverted.
**Owner:** hardini
**Branch:** `chore/clear-lint-warning-backlog` off `dev`

## What the backlog actually was

The follow-up list described "five files carrying import-order and sonarjs warnings". On `dev` at
`71f44a6` it was **16 warnings across 13 files**, in four groups:

| Group                                  | Count | Nature                     |
| -------------------------------------- | ----- | -------------------------- |
| `simple-import-sort/imports`           | 4     | autofixable                |
| `sonarjs/no-duplicate-string`          | 6     | extract a constant         |
| `unused-imports/no-unused-vars`        | 1     | a dead prop                |
| `react-hooks/exhaustive-deps`          | 1     | a memo that never memoized |
| `react-refresh/only-export-components` | 4     | **left alone** — see below |

12 cleared, 4 left deliberately. `dev`'s baseline moves from **16 to 4**.

## Two of them were not lint noise

- [x] **`src/app/providers.tsx`** carried an unused `dehydratedState` prop — and, next to it, a
      second `QueryClientProvider` nested inside the first **on the same client**. Nothing passed
      the prop; hydration is done per route, as `(app)/dashboard/page.tsx` does with its own
      `HydrationBoundary`. Removed the prop, the commented-out global boundary it existed for, and
      the duplicate provider. The warning was pointing at real dead code, and the double-nesting
      only became visible once the prop was gone.
- [x] **`src/hooks/useRouteParams.ts`** built `requiredKeys` as `options?.required ?? []` and put it
      in a `useMemo` dependency array. Both call sites pass an inline literal
      (`useRouteParams({ required: ["categoryId"] })`), so the array had a new identity on every
      render and **the memo never memoized** — it recomputed each time and returned a fresh object.
      Now depends on a joined primitive instead. Neither caller relied on the identity, so nothing
      observable changes; the hook just does what it claimed.

## The mechanical ones

- [x] `simple-import-sort` — `eslint --fix` scoped to the four affected files only, never repo-wide.
      Running it broadly is what kept dragging unrelated files into diffs and getting reverted.
- [x] `sonarjs/no-duplicate-string` — constants extracted in `MetricListSection.int.test.tsx`,
      `MetricForm.int.test.tsx`, `cursorSort.test.ts` (two: `createdAt` and `-createdAt` are
      separate literals) and `date-io.test.ts` (two: the date-only and datetime-local strings).
- [x] `sonarjs/prefer-immediate-return` in `sanitizeErrorMessage.ts`.

## Left alone: `react-refresh/only-export-components`

Four files — `MetricCategoryDetailContext.tsx`, `MetricCategoryReturnContext.tsx`,
`MetricDetailContext.tsx`, `features/organizations/context.tsx`. Each exports a Provider component
**and** its consumer hook, which is the standard React Context shape.

The rule's remedy, per `.claude/rules/code-style.md`, is to move the non-component export to another
file. That means splitting every context in this repo in two and updating their import sites — a
convention change, not a lint tidy, and one whose only benefit is Fast Refresh behaviour in
development. It wants a decision rather than a sweep.

- [ ] Decide whether context files split hook-from-provider repo-wide, or whether this rule should
      be disabled for `**/*Context.tsx` and `**/context.tsx` with a comment explaining why.

## A hazard worth recording

Writing `.join("\u0000")` through the editing tool put **two literal NUL bytes** into
`useRouteParams.ts` — the escape sequence was interpreted rather than written as six characters. Git
reclassified the file as binary (`Bin 1251 -> 1686 bytes` in `diff --stat`) and `file` reported
`data`. Every gate still passed, because a NUL inside a JS string literal is valid JavaScript.

Caught by reading `git diff --stat`, not by a gate. Fixed by not needing an exotic separator at all:
route param keys are identifiers, so `","` is unambiguous.

**Then it happened a second time, and the second time is the instructive one.** Describing the
hazard in prose reproduced it — this file and the commit-message draft each ended up with a NUL in
the sentence explaining the problem. `git commit` refused the message
(`error: a NUL byte in commit log message not allowed`), so the commit never happened, the
subsequent push created an empty branch, and `gh pr create` failed with "No commits between dev and
chore/clear-lint-warning-backlog". Three commands reported failures that all traced to one byte.

The verification below originally claimed "a control-byte scan over all ten changed files". That
scan iterated `git diff --name-only`, which lists **tracked, modified** files only — so it skipped
this file, which was untracked, and the draft, which lives outside the tree. It checked everything
except the two places the problem survived.

Two rules out of it:

- **Never write an escape sequence for a control character through an editing tool.** Use a
  plain-ASCII value, or build the string in code.
- **Scan staged _and_ untracked files, plus the commit draft** — `git diff --cached --name-only`
  with `git ls-files --others --exclude-standard`. A scan scoped to tracked modifications is
  precisely the one that misses a newly written file.

## Verification

| Gate                                 | Result                            |
| ------------------------------------ | --------------------------------- |
| `lint`                               | 0 errors, **4** warnings (was 16) |
| `lint:css`                           | clean — not triggered             |
| `typecheck`                          | clean                             |
| `format`                             | clean                             |
| `test:unit`                          | 80 suites, 669 tests              |
| `test:integration`                   | 19 suites, 99 tests               |
| `api:spec:check` / `api:types:check` | in sync — not triggered           |
| `build`                              | passes                            |
| `coverage:check --strict`            | all goals met                     |
| `test:e2e`                           | skipped, not run — not triggered  |

Plus a control-byte scan over every staged file, every untracked file and the commit draft — the
scope the first scan should have had.

## Status

**Complete.** No behaviour change intended anywhere, and none observed: the two substantive fixes
(`providers.tsx`, `useRouteParams.ts`) both remove work rather than change results, and the suites
that cover them are unchanged in count and all passing.

The `react-refresh` four are the only warnings left on `dev`. Once they are decided either way, the
"leave every file you touch warning-free" rule in `.claude/rules/code-style.md` becomes enforceable
rather than aspirational — and at four warnings, making `lint` fail on new ones is finally cheap.
