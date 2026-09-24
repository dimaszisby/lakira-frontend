# Measure authenticated routes in the performance job

**Purpose:** get the dashboard and the other signed-in pages under the Lighthouse gate.
**Owner:** hardini
**Branch:** unassigned
**Found:** 2026-09-24, in the first run of `frontend-performance`.

## The gap

`/dashboard` and `/metrics` were in the Lighthouse route list, but Lighthouse has no session, so
both redirected to `/login?returnUrl=…` and their scores (97 and 94 in run `35990283627`) were the
login page's. The routes were removed and the script now fails on a redirect — see
`2026-09-24-todo-perf-measurement-reliability.md`. So the signed-in app — the dashboard with its
charts, the metric lists — has never been measured.

## What it needs

- A test account on the environment the job runs against, with representative data. Today the job
  builds and starts the frontend locally in CI; it would also need a backend to authenticate
  against (staging, or one started in the job).
- The account's credentials as a GitHub secret. `.claude/rules/security.md`: staging credentials
  live only in GitHub or Vercel secrets, never in the repo.
- A signed-in session handed to Lighthouse: a pre-audit login that sets the session cookie, passed
  with `--extra-headers`, or a Puppeteer script.
- A backend request on the FE-to-BE Notion page, since the account and its data are the backend's.

## Checklist

- [ ] Decide which backend the job authenticates against.
- [ ] Raise the test-account request with the backend.
- [ ] Add the session mechanism to `scripts/perf/run-lighthouse.mjs`; the redirect check then proves
      the session worked.
- [ ] Add `/dashboard` and `/metrics` back to `performance-thresholds.json`.
