# Route error boundaries — Checklist

## Phase 0 — the panel and the boundaries

- [x] `src/components/ui/RouteErrorPanel.tsx` — title, fixed copy, the `digest` as a reference,
      a "Try again" button that calls `retry`; reports once through `reportClientError`; never
      renders `error.message`
- [x] `src/app/(app)/error.tsx` — new; the panel inside the app shell
- [x] `src/app/(auth)/error.tsx` — new; the panel inside the auth layout
- [x] `src/app/(app)/dashboard/error.tsx` — reduced to the panel, title "Unable to load dashboard"
- [x] `src/app/(app)/metrics/[metricId]/error.tsx` — reduced to the panel, title "Unable to load
      metric", heading kept at level 2 and width as before
- [x] `.claude/rules/architecture.md` § Error boundaries

## Discovered

- [x] Found: this Next version has a stable `retry` prop that fetches the segment again, and all
      three boundaries used `reset`, which does not → in scope, D-01
- [x] Found: the shared panel narrowed the metric detail boundary, which had no maximum width
      before (review) → in scope; width and spacing are now the route's, passed as `className`
- [x] Found: the "reports once" tests mocked the reporter, so they showed the effect's
      dependencies and not what the server receives (review) → in scope;
      `RouteErrorPanel.report.test.tsx` counts real requests under Strict Mode
- [x] Found: the list of boundaries in the route test is written by hand (review) → in scope; a
      case compares it with every `error.tsx` on disk
- [ ] Found: the dashboard and the metric detail page have no `h1` → out of scope, register row
      F-44
- [ ] Found: after a successful "Try again" the panel unmounts with focus on its button, and
      focus falls to the document body. Seen in a browser. Not a regression; the old boundaries
      did the same → out of scope, register row F-45
- [ ] Found: `src/app/global-error.tsx` still calls `reset` → out of scope, register row F-46
- [ ] Found: an error thrown in an intercepted `@modal` route is caught by the `(app)` boundary,
      which replaces the list under the dialog as well. Better than before, when it took the whole
      document → out of scope, register row F-47
- [x] Noted, by design: an error thrown by `(app)/layout.tsx` itself is not caught by
      `(app)/error.tsx` and still reaches `global-error.tsx`. `redirect()` and `notFound()` are
      rethrown by Next's boundary and are not shown as errors → stated in the rule

## Acceptance

- [x] AC-1 — a render error on an `(app)` page with no boundary of its own shows the panel inside
      the app shell · **browser, production build, temporary page**: the panel is inside
      `main#main` with the bottom navigation visible. On the same build without
      `(app)/error.tsx`: no `main#main` and no `nav` on the page
- [x] AC-2 — the same under `(auth)`, inside that group's layout · **browser, temporary page**:
      the panel shows with the layout's footer present
- [x] AC-3 — no boundary renders `error.message` · unit,
      `src/app/__tests__/route-error-boundaries.test.tsx`, all four boundaries; failed on the two
      old ones first. In the browser a thrown address and email appeared nowhere on the page
- [x] AC-4 — each boundary reports the error once · unit, the same file for the arguments;
      `src/components/ui/__tests__/RouteErrorPanel.report.test.tsx` for one POST under Strict Mode
- [x] AC-5 — accessible · `jest-axe` and a keyboard case in
      `src/components/ui/__tests__/RouteErrorPanel.test.tsx`; the panel is a `role="alert"`.
      Not checked: a screen reader. Known gap after recovery: F-45
- [x] AC-6 — "Try again" calls `retry` · unit, failed on the two old boundaries first.
      **Browser:** a temporary Server Component that throws on its first render showed the panel,
      and after "Try again" showed "recovered on render 2", so the server rendered it again
- [x] The temporary pages and the temporary spec are deleted; `git status` shows none

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — 977, with coverage; `coverage:check` passes
- [x] integration — 132
- [x] spec drift — `api:spec:check`, before handover
- [x] build
- [x] e2e — 18; e2e (csp) — 7; e2e (stack) — 28, on the final build
- [ ] e2e (csp, stack) — not run: no CSP or root layout change
