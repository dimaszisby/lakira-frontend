# F-08 — Neither route group has an error boundary

Register row [F-08](register.md). Read at `f67716e`.

## 1. What is wrong

Two things, in the same few files.

**Most pages have no boundary of their own.** There are two route-level boundaries,
`src/app/(app)/dashboard/error.tsx` and `src/app/(app)/metrics/[metricId]/error.tsx`, and the
last-resort `src/app/global-error.tsx`. Neither route group, `(app)` nor `(auth)`, has an
`error.tsx`. So a render error on the metrics list, the metric categories, the organization page,
the account page or any sign-in page is caught only by `global-error.tsx`, which replaces the root
layout: the sidebar and the navigation go, and by Next's own documentation that page does not
include the app's global styles or its theme
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md:165`). The audit
of 2026-10-10 grades "Root error boundary and 404" Partial for this.

**The two boundaries that exist print `error.message`.** `src/app/(app)/dashboard/error.tsx:23`
and `src/app/(app)/metrics/[metricId]/error.tsx:24` render it to the user. #82 stopped eight
other sites doing this and left these two, because they receive Next's error and not an API error.

## 2. Root cause

Boundaries were added where a failure had been seen, one route at a time, and the group level was
never filled in. The two that exist predate the rule that an error is normalized before display
(`.claude/rules/data-access.md`).

## 3. Options

- **A. One `error.tsx` per route group**, `src/app/(app)/error.tsx` and
  `src/app/(auth)/error.tsx`. An `error.tsx` wraps the pages and nested layouts below it and not
  the layout beside it (`error.md:96`), so the `(app)` one renders inside the app shell: the
  sidebar stays and the user can go elsewhere. Two small files.
- **B. A, plus one shared presentational component** for all four boundaries, with fixed copy and
  a retry button, and no `error.message`. Removes the duplication between the two existing files
  and settles the second finding in the same change.
- **C. A boundary per route.** Finer recovery. About ten more files that would all say the same.
- **D. Leave it to `global-error.tsx`.** Today's state.

## 4. Recommendation

**B.** The message a boundary receives is not for users: Next replaces a Server Component
error's message with a generic one and gives a `digest` (`error.md:111`), and in every other case
the text is whatever the code threw. Fixed copy and the digest, when there is one, say as much and
leak nothing. Each boundary reports through `reportClientError`, as `global-error.tsx` does.

## 5. Acceptance criteria for the fix

- **AC-1** — A render error on a page under `(app)` that has no boundary of its own shows an
  error panel inside the app shell, with the sidebar still present and a retry control.
  _Why:_ the audit item; a user must be able to leave the broken page.
- **AC-2** — The same under `(auth)`, inside that group's layout. _Why:_ the same item.
- **AC-3** — No boundary renders `error.message`. _Why:_ `.claude/rules/data-access.md`; the two
  sites #82 left.
- **AC-4** — Each boundary reports the error once through `reportClientError`. _Why:_ otherwise
  a contained error is one nobody hears about.
- **AC-5** — The panel passes `jest-axe`, and its retry control is reachable by keyboard.
  _Why:_ WCAG 2.1.1 Keyboard and 4.1.2 Name, Role, Value; an error state is user-facing UI.

## 6. Size and shape

≤½ day. A small sweep; the plan-level "Accessibility" concerns are covered by AC-5. No ADR: no
interface, dependency or boundary changes. Gates: the always-on gates, integration (a route
boundary is routing), and `e2e (stack)`, since the app layout's subtree changes.

## 7. Depends on, unblocks

Depends on nothing. Closes the audit's "Root error boundary and 404" at the next dated run. F-28,
a lint rule against rendering `error.message`, is easier to write once no legitimate site does it.

## 8. Not verified

- That a render error on an unbounded page reaches `global-error.tsx` in a production build and
  loses the shell. It is read from Next's documentation and the file tree, not seen in a browser.
- Whether `loading.tsx` at the group level is wanted too. The audit names it in the same line;
  this analysis covers error boundaries only.
- The postmortems under `docs/internal/incidents/` cover routing; they were not re-read for this
  file and should be before the fix starts.
- No reproduction was run for this kit.
