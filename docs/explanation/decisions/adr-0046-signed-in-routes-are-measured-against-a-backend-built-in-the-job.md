# ADR-0046 — Signed-in routes are measured against a backend built in the job

- **Status:** Accepted
- **Date:** 2026-11-06
- **Related:** follows `frontend-stack-e2e` (kit `stack-suites-in-ci`, D-01), whose backend start
  it shares
- **Origin:** issue #176 (register row F-38), under two days and so without a kit; the owner chose
  the backend on 2026-11-06

---

## Context

The Lighthouse gate in `frontend-performance` measured public pages only. `/dashboard` and
`/metrics` were dropped from it on 2026-09-24, because Lighthouse has no session: both redirected
to `/login` and were scored as the login page. So the signed-in app, the dashboard's charts and the
metric lists, had never been measured.

Measuring them needs a backend to sign in to, an account on it, and data that makes the pages
representative. When the gap was found, the only backend reachable from CI was staging, which would
have needed a test account requested from lakira-backend and stored as a secret.
`frontend-stack-e2e` has since shown another way: it builds lakira-backend `dev` inside the job and
registers a fresh user for each run.

## Decision

1. **The performance job builds and starts lakira-backend `dev` in the job.** The steps are a
   composite action, `.github/actions/start-lakira-backend`, which `frontend-stack-e2e` uses too,
   so the two jobs start the backend the same way.
2. **Each run registers a fresh user and seeds its own data** through `/api/proxy`
   (`scripts/perf/signed-in-session.mjs`): one category and three metrics with fourteen days of
   logs. No credential is stored anywhere, and the script refuses any host that is not local.
3. **Every Lighthouse run of a signed-in route gets a fresh session.** The script signs in through
   the proxy and passes the session cookie to Lighthouse with `--extra-headers`, so the 15-minute
   access token cannot expire mid-route. The existing redirect check is the proof that the session
   worked: a run that lost it lands on `/login` or `/api/auth/revive` and fails as `REDIRECTED`.
4. **Signed-in routes are listed apart from public ones**, as `lighthouse.signedInRoutes` in
   `scripts/perf/performance-thresholds.json`, and meet the same category thresholds. A run with
   signed-in routes configured and no reachable backend fails. `PERF_PUBLIC_ONLY=1` skips them for
   a local run without the stack, and the summary says so.
5. **The Web Vitals come from a run with real throttling.** After its three simulated runs, each
   route gets one more with `--throttling-method=devtools`, the same network and CPU limits applied
   by the browser, and `perf:web-vitals` reads LCP, CLS and INP from it. The category scores stay
   on the simulated median. Simulated LCP counts every script requested before first paint: on the
   first signed-in run it put `/metrics` at 3,660 ms, over the 3,600 ms budget, where real
   throttling measured 1,695 to 1,803 ms, equal to its first paint. Taking 15.5 KB of
   `framer-motion` out of the page's first load moved the simulated figure by nothing (#193).

## Options considered

- **Staging:** rejected. It needs an account requested from the backend and kept as a secret, data
  that persists and drifts between runs, and it would measure the network to Render rather than
  the app.
- **A Puppeteer login flow inside Lighthouse:** rejected. A pre-audit login through the proxy sets
  the same cookie the app's own login sets, with less code and nothing new to install.
- **One session for every run:** rejected. Five or six runs across two routes can outlast the
  15-minute access token, and the revive redirect would then fail a run for a reason that is not
  the page's.
- **Copying the backend steps into `performance.yml`:** rejected. Two copies of a dozen steps drift;
  the action keeps them one.
- **Simulated LCP with a higher budget for signed-in routes:** rejected. It would keep gating a
  number no user sees, which rises with JavaScript whether or not the JavaScript delays the paint.
- **Every run with real throttling:** rejected. Simulated scores are the more repeatable across
  CI runners, and the category gate has relied on them since 2026-09-24.

## Consequences

- The nightly performance run depends on lakira-backend `dev`. A backend that does not build or
  start turns it red, as it already does `frontend-stack-e2e`. Neither runs on pull requests, so
  backend changes still cannot block frontend work.
- The job takes several minutes longer, for the backend build, the seeding and one more run per
  route.
- LCP is now measured as users would see it under the same limits, about 1.7 s on every route
  measured, so the 3,600 ms budget has room to tighten toward the 2,500 ms the budget page targets.
- The scores are for a small, fixed data set. A regression that only shows with many metrics or
  long histories is not caught.
