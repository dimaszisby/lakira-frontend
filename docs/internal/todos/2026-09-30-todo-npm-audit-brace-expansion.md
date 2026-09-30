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
- [ ] Hand over commit and PR; after it merges, bring #62 up to date with `dev` so its
      Security Scan re-runs against the fix

## Status

Fixed 2026-09-30 on `fix/deps-brace-expansion-audit`, apart from the hand-over item. Plain
`npm audit fix` (Node 24.21.0, npm 11.19.0) changed 7 lockfile entries, patch versions only:
`brace-expansion` 1.1.18 to 1.1.21, 2.1.4 to 2.1.7 (three copies), 5.0.9 to 5.0.12 (two
copies), and `fast-uri` 3.1.7 to 3.1.8. All resolve from `registry.npmjs.org` with `sha512`
integrity; no other lockfile field changed. `npm ci` accepts the lockfile, and `npm audit`
finds 0 vulnerabilities. All gates listed above passed.

This clears the advisory, not the pattern: a dev-tool advisory fails every open PR. The
long-term change (block PRs on production dependencies only, audit everything on a schedule)
is its own task.
