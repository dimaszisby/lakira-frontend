# Performance measurement reliability

**Purpose:** make the nightly Lighthouse gate measure what it claims, and stop it failing on noise.
**Owner:** hardini
**Branch:** `fix/perf-measurement-reliability` off `dev`

## How this started

`frontend-performance` ran for the first time on 2026-09-24, once `dev` became the default branch
(see `2026-09-24-todo-main-has-unrelated-history.md`). Run `35990283627` failed: `/` scored 58
against a threshold of 70, with Total Blocking Time 3,120 ms. Every other route was at 20 ms. The
task was opened as "fix `/`". The investigation found no defect in `/`, so it was re-scoped, with
approval, to the measurement.

## The evidence

- **The chunks are framework code.** The two scripts carrying the blocking time were
  `2zafgs90r_leq.js` (React DOM) and `0uqi33pd5k1ik.js` (Next's compiled `web-vitals`), both
  loaded by every page. Turbopack's chunk hashes are deterministic, so a local build mapped CI's
  report onto source exactly. The first guess — `/`'s `<Link>`s prefetching the auth pages' form
  bundles — was wrong: neither chunk contains form code.
- **Not reproducible locally.** 18 loads, a fresh headless Chrome each, CPU throttled 4x, long tasks
  recorded before any page script: `/` had **0 ms** blocking time in every load; `/login` and
  `/register` had 17–49 ms. `/` is the lightest of the three.
- **Not reproducible in CI.** The same workflow on the same commit (run `35992035005`): `/` scored
  **81** and passed, TBT 560 ms; the other routes 50 ms.
- **Machine noise is visible in the reports.** Lighthouse's `benchmarkIndex` (its own CPU speed
  measurement) was 1,847 while auditing `/` and about 2,450 for the other routes in the same run;
  3,084 in the first run. `/` is always audited first on a freshly started machine.

## What is actually wrong

1. **One run per route.** Lighthouse's own guidance is that a single run is noisy and the median of
   several is the stable figure. A gate on one run fails on noise, and a gate that fails on noise
   gets ignored.
2. **Two of the four routes measure the login page.** `/dashboard` and `/metrics` are protected; with
   no session they redirect to `/login?returnUrl=…`, and the script scored the redirect target
   without noticing. The dashboard has never been measured.
3. **Lighthouse is unpinned.** `npx --yes lighthouse` fetched whatever version was newest on every
   run (12.8.2 on 2026-09-24), so a score could move with no change here.

## Decisions

**D-1 — Three runs per route, gate on the median.** Per category, the median of three scores is
compared with the threshold. The run with the median performance score becomes the route's
canonical report, which `web-vitals-lab-summary.mjs` reads, so the lab vitals also come from a
real, representative run rather than an average of runs. Cost: about two more minutes on a nightly
job with a 45-minute timeout.

- Rejected: a throwaway warm-up audit before the real ones. It addresses the first-route effect
  only, not run-to-run variance, which the rerun shows is large on its own.

**D-2 — A redirect fails the route.** If a report's final URL path differs from the requested
route, the route is recorded as `redirected` and the run fails. A gate must never silently score a
different page.

**D-3 — Measure the public pages only, for now.** Routes become `/`, `/login`, `/register`.
Measuring `/dashboard` and `/metrics` needs a signed-in session in CI — a backend test account and
a CI secret — filed as `2026-09-24-todo-authenticated-perf-routes.md`.

**D-4 — Pin with `npx lighthouse@12.8.2`.** Pins Lighthouse itself, at the version CI already ran.

- Known limit: `npx` does not use the lockfile, so Lighthouse's own dependencies still resolve at
  run time.
- Rejected for now: Lighthouse as a `devDependency`. It pins the whole tree and puts it under
  `npm audit`, but it is a new dependency (an ADR, per the workflow rules), and `npm ci` in every
  CI job would install it and its browser tooling to serve one nightly job. Worth revisiting if the
  performance job moves to its own `package.json`.

Thresholds are unchanged.

## Checklist

- [x] `scripts/perf/performance-thresholds.json` — routes `/`, `/login`, `/register`;
      `runsPerRoute: 3`; `version: "12.8.2"`.
- [x] `scripts/perf/run-lighthouse.mjs` — pinned version, N runs, median gate, redirect check,
      canonical report = median-performance run, per-run scores in the summary.
- [x] Prove the median and the redirect check on a local production server.
- [x] Docs that list the routes or describe the gate: `.claude/rules/performance.md`,
      `docs/reference/commands.md`.
- [x] `2026-09-24-todo-authenticated-perf-routes.md` filed.
- [x] `2026-09-24-todo-main-has-unrelated-history.md` — the default-branch switch recorded.
- [ ] After push: dispatch the workflow on this branch three times; all pass.

## Proof

A production build of this branch, served locally, with the script run exactly as CI runs it:

| Check                        | Result                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Real config                  | `/` 95 `[94, 95, 95]`, `/login` 92 `[92, 92, 92]`, `/register` 92 `[92, 92, 93]`; exit 0 |
| Canonical report is median   | `home.json`, `login.json` and `register.json` are each byte-identical to the median run  |
| Lab Web Vitals               | read the canonical reports; all three routes within LCP and CLS budget; exit 0           |
| `/dashboard` added to a copy | `REDIRECTED to /login, not measured`; exit 1 — the old script scored this 97             |

Gates: `lint` (the script included), `lint:css`, `typecheck`, `format` clean; `test:unit` 80 suites,
669 tests; `build` passes. `test:integration`, spec drift and `test:e2e` skipped, not triggered.

## Discovered

- [x] Found: `npx --yes lighthouse` was unpinned → in scope, it is D-4.
- [x] Found: authenticated routes never measured → out of scope, filed as
      `2026-09-24-todo-authenticated-perf-routes.md`.

## Status

**Complete pending the CI dispatches.** No application code changed; the gate now measures three
public pages on the median of three pinned Lighthouse runs, and refuses to score a page it was
redirected to. No threshold moved.

**Not promoted to an ADR.** Measurement method, recorded beside the rule in
`.claude/rules/performance.md`; no interface, data shape, dependency or security boundary changes.
