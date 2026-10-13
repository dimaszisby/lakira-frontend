---
name: route-error-boundaries-review
description: Review of fix/route-error-boundaries (shared RouteErrorPanel plus group-level error.tsx); what to check when a fallback component is shared and its effects are mocked in tests
metadata:
  type: project
---

Approve with warnings; branch fix/route-error-boundaries (debt register F-08).

**How to apply:** When a test mocks a function that carries its own dedupe or cap (here `reportClientError`), "reports once" tests only prove the component's effect deps, not the behaviour users get: check whether the test renders under Strict Mode (`reactStrictMode: true`, testing.md) and whether the real function's dedupe is what actually saves it. For a shared fallback that fixes its heading level, grep for existing `<h1>` in the tree it replaces before accepting a comment that says "the layout keeps its own heading"; a level-2 choice justified by a claim about neighbours is only as good as the grep. For error boundaries, confirm from Next's own docs in node_modules which things the boundary does not wrap (the layout in the same segment) and that router errors are rethrown (`isNextRouterError` in error-boundary.js), rather than reasoning from memory. A moved component also moves its look: compare old and new class lists for silent restyling.
