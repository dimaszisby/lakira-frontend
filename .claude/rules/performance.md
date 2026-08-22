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

Aim at the doc targets. The JSON is the floor, not the goal. Routes audited: `/`, `/login`, `/dashboard`, `/metrics`.

These are **lab** measurements derived from Lighthouse, not real-user monitoring. RUM is not implemented — do not describe these numbers as field data.

## When it runs

`.github/workflows/performance.yml` runs nightly at 02:00 UTC and on manual dispatch — **not on PRs**. A regression will not block your merge; it will show up the next morning. If a change is likely to move the numbers, run it yourself:

```bash
npm run build && npm run perf:bundle-size
npm run start &          # then, once it is up:
npm run perf:lighthouse && npm run perf:web-vitals
```

## What actually costs money here

- **Client-component creep.** A `"use client"` at the top of a layout pulls its whole subtree into the client bundle. Push the boundary as deep as possible: server components fetch, client components interact. This is the largest single lever in an App Router codebase.
- **Chart.js.** `chart.js` + `react-chartjs-2` + the date adapter are heavy and only needed on visualisation routes. Load them with `next/dynamic` and `ssr: false`; never import them into shared layout code.
- **`framer-motion`** is likewise heavy. Prefer CSS transitions — `--btn-transition` and friends exist in `scales.css` — and reserve Framer for animation that CSS genuinely cannot express.
- **Icons.** `phosphor-react` should be imported per-icon, never as a namespace.
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
