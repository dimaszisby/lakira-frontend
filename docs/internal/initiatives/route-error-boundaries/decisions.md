# Route error boundaries — Decisions Log

`D-NN` entries scoped to this kit. `F-NN` is a row of
[`frontend-debt-register/register.md`](../frontend-debt-register/register.md).

---

## D-01 — A boundary's "Try again" calls `retry`, and its copy is fixed

- **Status:** Accepted
- **Date:** 2026-10-13

**Context.** F-08 asked for an error boundary in each route group and for the two existing
boundaries to stop printing `error.message`. Reading this Next version's own documentation for
`error.js` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`)
before writing them showed something the register's analysis had not: Next 16.3 made a `retry`
prop stable. `retry` fetches and renders the segment again. `reset`, which all three boundaries in
this repository used, only clears the error state and renders the children from what is already
there, and the documentation now says to prefer `retry`.
**Decision.** One shared panel, `src/components/ui/RouteErrorPanel.tsx`, is what every `error.tsx`
renders. Its button calls `retry`. Its copy is fixed: the title the route passes, one sentence,
and the error's `digest` as a reference when there is one. It never renders `error.message`.
**Options considered.** Keeping `reset`: rejected, a failed server fetch is the common cause of a
route error here, and clearing the error without fetching again shows the same failure. Showing
`error.message` only outside production: rejected, a boundary that behaves differently in the
build nobody tests by hand is how the two existing ones kept printing it. A boundary per route:
rejected in the register's analysis; about ten files that would all say the same.
**Consequences.** `global-error.tsx` still uses `reset`; it renders its own document and was left
alone, and is recorded as found. A route that wants its own wording passes a title; one that wants
more than a title needs a change to the panel, by design.
