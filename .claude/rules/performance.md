---
paths:
  - src/app/**
  - src/components/**
  - src/features/**
  - next.config.ts
  - scripts/perf/**
---

# Performance

Human baseline: [`docs/reference/performance-budget.md`](../../docs/reference/performance-budget.md).
Machine-enforced thresholds: `scripts/perf/performance-thresholds.json`.

## The budgets

Two sets exist, and they disagree. The doc states the aspiration; the JSON is what actually fails CI.

| Metric | Doc target (p75) | Enforced in CI |
|---|---|---|
| LCP | ≤ 2.5s (soft 3.0s) | 3600 ms |
| CLS | ≤ 0.1 | 0.15 |
| INP | ≤ 200 ms (soft 300 ms) | 300 ms |
| Lighthouse performance | — | ≥ 70 |
| Lighthouse accessibility | — | ≥ 90 |
| Lighthouse best-practices | — | ≥ 90 |
| Total JS | — | ≤ 3,000,000 bytes |
| Largest chunk | — | ≤ 300,000 bytes |

Aim at the doc targets. The JSON is the floor, not the goal. Routes audited: `/`, `/login` and `/register` (`routes`), and `/dashboard` and `/metrics` signed in (`signedInRoutes`), since 2026-11-06. The signed-in routes are measured as a user registered for the run, with one category and three metrics of fourteen days' logs seeded through `/api/proxy`, against a backend built in the job from lakira-backend `dev` ([ADR-0046](../../docs/explanation/decisions/adr-0046-signed-in-routes-are-measured-against-a-backend-built-in-the-job.md), `scripts/perf/signed-in-session.ts`). Before then they were not measured: with no session they redirected to `/login`, and were scored as the login page.

How the Lighthouse gate reads a result:

- **Median of three runs per route.** A single Lighthouse run is noisy — on 2026-09-24 the same commit scored 58 and then 81 on `/`. One failing run is not a regression; a failing median is. Do not reduce `runsPerRoute` to speed the job up.
- **A redirect fails the route.** If a route's final URL differs from the one requested, the run fails with `REDIRECTED`, rather than scoring the page it landed on. For a signed-in route this is the session check: one that lost its session lands on `/login` or `/api/auth/revive`.
- **Every run of a signed-in route signs in afresh**, and passes the session cookie to Lighthouse with `--extra-headers`, so the 15-minute access token cannot expire mid-route. With no user, because the backend is down or the app is not on a local host, the signed-in routes fail as `NO SESSION`.
- **Lighthouse is pinned** (`lighthouse.version` in the JSON), so a score cannot move because a new Lighthouse was published. Bump it deliberately, in its own change, and expect scores to shift with it.
- Each route's canonical report (`reports/performance/lighthouse/<route>.json`) is its median-performance run; the individual runs sit beside it as `<route>.run-N.json`.

These are **lab** measurements derived from Lighthouse, not real-user monitoring. RUM is not implemented — do not describe these numbers as field data.

## When it runs

`.github/workflows/performance.yml` runs nightly at 02:00 UTC and on manual dispatch, and on a PR only when it changes the job itself, the backend start it shares, or `scripts/perf/`. **It gates no other PR.** A regression will not block your merge; it will show up the next morning. If a change is likely to move the numbers, run it yourself:

```bash
npm run build && npm run perf:bundle-size
npm run start &          # then, once it is up:
npm run perf:lighthouse && npm run perf:web-vitals
```

The signed-in routes need the local stack (`docs/how-to/testing/run-stack-e2e.md`), and the app built with `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000` so its server-side prefetch reaches its own proxy. Without the stack, set `PERF_PUBLIC_ONLY=1` on both perf commands; the signed-in routes are then reported as skipped.

## What actually costs money here

- **Client-component creep.** A `"use client"` at the top of a layout pulls its whole subtree into the client bundle. Push the boundary as deep as possible: server components fetch, client components interact. This is the largest single lever in an App Router codebase.
- **Chart.js.** `chart.js` + `react-chartjs-2` + the date adapter are heavy and only needed on visualisation routes. Load them with `next/dynamic` and `ssr: false`; never import them into shared layout code.
- **`framer-motion`** is likewise heavy. Prefer CSS transitions — `--btn-transition` and friends exist in `scales.css` — and reserve Framer for animation that CSS genuinely cannot express.
- **Icons.** `@phosphor-icons/react` should be imported per-icon, never as a namespace. (It replaced the unmaintained `phosphor-react` on 2026-09-15; the icon names are unchanged, so imports differ only in the package specifier.)
- **Fonts.** Two Google fonts are already loaded via `next/font` with `display: "swap"`. A third needs a justification.
- **`date-fns`** — import the specific function, not the package root.

## Rendering

- Default to server components. Add `"use client"` only when a hook or event handler requires it.
- Reserve layout space for anything that loads late — images, charts, async lists. CLS is mostly unreserved space.
- `next/image` for images, with explicit dimensions.
- Prefetch deliberately. TanStack Query prefetching on the server needs `getServerAuthHeaders()` or it 401s silently and you pay for a wasted request (see `.claude/rules/data-access.md`).

## Do not

- Do not add `@next/bundle-analyzer` or Lighthouse CI as dependencies to answer a one-off question — `npm run perf:bundle-size` already reports per-chunk sizes into `reports/performance/`.
- Do not raise a threshold in `performance-thresholds.json` to make a build pass. Raising a budget is a decision that needs a `decisions.md` entry.
- Do not memoize speculatively. `memo`, `useMemo`, and `useCallback` have a cost; use them where a profile shows a problem, and follow the naming rule in `.claude/rules/code-style.md` when you do.
