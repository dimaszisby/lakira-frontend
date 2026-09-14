# Metric log modal interception

**Purpose:** ticket B — "`/metrics/:id/logs/new` renders Page not found, so logs cannot be added
through the UI".
**Owner:** hardini
**Branch:** `fix/metric-log-modal-interception` off `dev`

## The reported symptom was already gone

"Page not found" was the **session** bug, not routing. `[metricId]/layout.tsx` turns any fetch
failure into `notFound()`, and every proxied call was returning 401 against a dead token. Ticket A
fixed that, so by the time this was investigated both the direct URL and the in-app button rendered
the form. There is no `/metric-logs/new` fetch anywhere in the logs — the diagnosis in the original
follow-up note does not hold.

## What was actually broken

Clicking "Add Logs" logged, on every click:

```
⨯ Error: Invalid interception route: /metrics/<id>/logs/(.)(.)new
```

`@modal` held **two interceptors that match the same segment** — `(.)new` and `(.)[logId]`, both
bare leaves. Next built the interception path with the marker applied twice, and
`extractInterceptionRouteInformation` rejects that: it splits the path on `(.)`, and with the marker
doubled the intercepted route comes back empty.

**Why it survived a release:** the throw killed the soft navigation, Next fell back to a full page
load, and the modal appeared anyway. The user sees a slower transition and loses the list behind the
modal; the server logs a 500 per click. Nothing looks broken enough to report.

Sibling interceptors are fine when only one can match a segment — `metrics/@modal` pairs `(.)new`
with `(.)[metricId]/edit`, and the second is a nested path rather than a leaf.

- [x] Collapsed to one interceptor. `logs/[logId]/page.tsx` serves both, branching on the
      `NEW_RECORD_SEGMENT` sentinel; `@modal/(.)new` and the static `logs/new/` are deleted.
- [x] Named the sentinel in `src/lib/routes.ts`, where the `"new"` literal already lived.

## A second, unreported occurrence

The regression test found `metric-categories/[categoryId]/metrics/@modal` carrying the identical
`(.)new` + `(.)[metricId]` pair. Nobody had reported it.

- [x] Fixed the same way.

**Those routes are dead.** `MetricListSection` pushes to `/metrics/new` and `/metrics/:id/edit`, so
nothing navigates into `metric-categories/:id/metrics/**` at all — they are reachable only by typing
the URL. They are correct now rather than broken, but deleting the subtree is probably the better
answer. Left for the owner.

## The regression test reads the tree, it does not render

`src/app/__tests__/parallel-route-interceptors.test.ts` walks `src/app` for `@slot` directories and
asserts none holds a dynamic and a static leaf interceptor under the same marker. Rendering cannot
catch this — the fallback makes the UI look fine — and it is what found the second occurrence.

It also asserts it matched at least one slot, so the walker cannot silently pass by finding nothing.
That is the failure mode the 2026-08-17 `boundaries` lesson describes.

## Verification

Against the live backend, with a clean `.next` and a fresh dev server:

| Path | Result |
| --- | --- |
| Create, intercepted (click "Add Logs") | modal over the list, list visible behind, **no interception error** |
| Create, hard load `/logs/new` | "Add Log Entry", no Delete button |
| Edit, hard load `/logs/:logId` | "Edit Log Entry" with the row's value and timestamp |
| A log actually created through the UI | row appears in the table — the thing the ticket said was impossible |

| Gate | Result |
| --- | --- |
| `lint` | 0 errors, 17 warnings (`dev` baseline 21) |
| `lint:css` | clean |
| `typecheck` | clean |
| `test:unit` | 77 suites, 646 tests |
| `test:integration` | 18 suites, 91 tests |
| `coverage:check --strict` | all goals met |
| `build` | passes; one interceptor per slot in the route list |

## Status

**Complete**, with one path not directly exercised: **edit via interception**. There is no desktop
edit affordance — `MetricLogsClient` passes `onEdit` to `LogTable` but never `onRowClick`, so
clicking a row does nothing on desktop. Edit is reachable on mobile (SwipeableCard) and by URL. The
intercepted edit path shares the single interceptor that create was verified through, so the routing
is covered; the missing affordance is a separate UI gap.

## Follow-ups

- **No desktop edit affordance for logs** (above). Either wire `onRowClick`, or add an actions
  column.
- **`metric-categories/[categoryId]/metrics/**` is unreachable.** Delete, or link it up.
- The original follow-up note's diagnosis for this ticket was wrong in both particulars. Worth
  remembering when reading the rest of that list.
