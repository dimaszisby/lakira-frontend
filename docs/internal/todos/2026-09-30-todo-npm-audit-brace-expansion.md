# 2026-09-30 - Todo: clear the brace-expansion high advisory failing Security Scan

**Context:** found on PR #62 (`fix/metric-settings-strict-mode-test`). Its `Security Scan` job
failed at `npm audit --audit-level=high` (run 36696957126). #62 touches no `package.json` or
`package-lock.json`, and this branch's lockfile is identical to `dev` at 77ee753, so every PR
and the next `dev` run fail the same way until this lands. Same shape as
[`2026-09-10-todo-npm-audit-high-critical.md`](2026-09-10-todo-npm-audit-high-critical.md),
which a plain `npm audit fix` resolved (899545f).

## Findings (2: 1 high, 1 moderate)

| Package                                | Severity | Advisories                                                          | Pulled in by                                                               |
| -------------------------------------- | -------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `brace-expansion` 1.1.18, 2.1.4, 5.0.9 | high     | GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p (DoS) | `minimatch` via eslint, typescript-eslint, openapi-typescript, tailwindcss |
| `fast-uri` 3.1.7                       | moderate | GHSA-hrr3-gc8f-f4qj                                                 | `ajv` via stylelint                                                        |

All are dev tooling; none reaches the browser bundle. CI fails on them regardless.

`npm audit fix --dry-run` (Node 24.21.0, npm 11.19.0) reports a fix without `--force`, so the
patched versions sit inside ranges the parents already declare.

## Checklist

- [x] `npm audit fix` (no `--force`) with Node 24's npm, so the lockfile matches CI
- [x] `package.json` unchanged; `package-lock.json` the only dependency change
- [x] `npm run security:audit` exits 0
- [x] Gates: lint, css lint, typecheck, format, unit, integration, build, and
      `api:types:check` (openapi-typescript is in the chain)
- [x] Hand over commit and PR (#63: lockfile fix, contract sync, production advisories, docs)
- [ ] After #63 merges, bring #62 up to date with `dev` so its Security Scan and API Contract
      Drift re-run against the fixes

## Discovered

- [x] Found: #63 failed `API Contract Drift` once its Security Scan passed. Backend #125
      (2fd4e29, 2026-09-30) added a `description` to `TrendDataPoint.date`; no path, type or
      field changed, but the snapshot check is byte-exact, so `dev` and every PR failed. A
      separate sync PR would fail Security Scan on the old lockfile, so the sync rides #63 as
      its own commit (precedent: ac5368e in #17) -> in scope. `api:spec:sync` and
      `api:types:generate` changed one line each; the frontend does not call
      `GET /metrics/{metricId}/trends`, so no code changes.
- [x] Found: on 2026-10-01, re-running `security:audit` before the sync handover failed again
      on production dependencies: `next` 16.3.4 critical (RCE in `next/og` `ImageResponse`,
      GHSA-vcvr-r3jv-pc5j), `axios` 1.19.0 high (12 advisories), `dompurify` 3.4.14 low
      (GHSA-p98j-92pf-mc4p). Every PR fails until fixed, so this rides #63 too -> in scope.
      `npm audit fix`: `next` family 16.3.4 to 16.3.8, `axios` 1.19.0 to 1.20.0, `dompurify`
      3.4.14 to 3.4.16; `package.json` unchanged. `next/og` and `dompurify` are not imported
      in `src` (Inference: the RCE was not reachable); `axios` is the HTTP client in
      `src/services/api/api.ts`. Verified with every gate, coverage, and both Cypress suites
      against a fresh build on `:3100` (public 18/18, stack 13/13).
- [ ] Found: #125 also orders logs by logged time, which the spec documents only for trends.
      The `/metric-logs` lists may now come back in a different order -> out of scope; check
      separately.

## Status

Fixed 2026-09-30 on `fix/deps-brace-expansion-audit`; see Discovered for what joined it on 2026-10-01. Plain
`npm audit fix` (Node 24.21.0, npm 11.19.0) changed 7 lockfile entries, patch versions only:
`brace-expansion` 1.1.18 to 1.1.21, 2.1.4 to 2.1.7 (three copies), 5.0.9 to 5.0.12 (two
copies), and `fast-uri` 3.1.7 to 3.1.8. All resolve from `registry.npmjs.org` with `sha512`
integrity; no other lockfile field changed. `npm ci` accepts the lockfile, and `npm audit`
finds 0 vulnerabilities. All gates listed above passed.

This clears the advisory, not the pattern: a dev-tool advisory fails every open PR. The
long-term change (block PRs on production dependencies only, audit everything on a schedule)
is its own task.
