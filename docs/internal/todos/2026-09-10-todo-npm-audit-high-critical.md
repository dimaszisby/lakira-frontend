# 2026-09-10 — Todo: clear npm audit high/critical findings blocking Security Scan

**Context:** discovered while opening PR #13 (`chore/sync-error-envelope-contract`,
error-envelope contract sync). `Security Scan`'s `npm run security:audit`
(`npm audit --audit-level=high`) failed on that PR — confirmed unrelated to its
diff, since the PR touches no `package.json`/`package-lock.json`, and `dev`'s
last CI run (2026-08-29) predates these advisories. This is dependency drift on
`dev` itself; it will fail identically on any PR opened from here until fixed.

Related but not a duplicate: [`2026-08-22-todo-cypress-security-upgrade.md`](2026-08-22-todo-cypress-security-upgrade.md)
covers a narrower, now-stale set of findings (8, all traced to `@cypress/request`
inside `cypress@14.5.4`). That todo is still open and not started. The set below
is the current full `npm audit --audit-level=high` output and supersedes it in
scope — check both off together rather than doing the cypress bump twice.

## Current findings (10 total: 1 low, 3 moderate, 5 high, 1 critical)

| Package                                                                               | Severity                       | Advisory                                                                                                                                                                                                                 | Fix                                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `next` 16.0.0–16.3.2                                                                  | **critical**                   | [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) (unauth RCE, Windows-hosted), [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) (unauth RCE via AVIF image optimization) | `npm audit fix` — check target Next version against App Router / Next 16 usage before taking it    |
| `browserslist` ≤4.28.6                                                                | high                           | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx), [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g)                                                                       | `npm audit fix`                                                                                    |
| `fast-uri` 3.0.0–3.1.5                                                                | high                           | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) + 3 more (host confusion / SSRF)                                                                                                                | `npm audit fix`                                                                                    |
| `js-yaml` (via `@redocly/openapi-core`, used by `api:spec:sync`/`api:types:generate`) | high                           | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh)                                                                                                                                                 | `npm audit fix` — verify `api:spec:sync` / `api:types:generate` still work after                   |
| `sharp` <0.35.4                                                                       | high                           | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)                                                                                                                                                 | `npm audit fix`                                                                                    |
| `@cypress/request` (bundled in `cypress@14.5.4`) — `qs`/`uuid`/`extract-zip`          | high (rolled up in prior todo) | see prior todo                                                                                                                                                                                                           | `npm audit fix --force` → cypress 14.5.4 → 15.21.0, **major**, needs its own E2E verification pass |
| `@humanfs/node` <0.16.8                                                               | moderate                       | [GHSA-p498-v437-472g](https://github.com/advisories/GHSA-p498-v437-472g)                                                                                                                                                 | `npm audit fix`                                                                                    |
| `colord` <2.9.4                                                                       | moderate                       | [GHSA-2wm5-q62r-hmrv](https://github.com/advisories/GHSA-2wm5-q62r-hmrv)                                                                                                                                                 | `npm audit fix`                                                                                    |
| `qs` 2.2.5–6.15.3                                                                     | moderate                       | [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g)                                                                       | `npm audit fix`                                                                                    |
| `postcss-selector-parser` 6.1.0–6.1.2 / 7.1.0–7.1.2                                   | (low, rolled up)               | [GHSA-w9m9-85wc-3x92](https://github.com/advisories/GHSA-w9m9-85wc-3x92)                                                                                                                                                 | `npm audit fix`                                                                                    |

## Why this was expected to be its own task (turned out not to be)

The plan going in was: run plain `npm audit fix` for the non-breaking findings
first, then handle `next` (critical RCE) and `cypress` (the prior todo's
`@cypress/request` chain) as separate major-bump steps needing their own
verification passes.

That assumption was wrong. `package.json` already declared `next: ^16.0.3` and
`cypress: ^15.21.0` — ranges that permit the fixed versions — but the committed
lockfile hadn't been re-resolved against them. A single plain `npm audit fix`
(no `--force`) resolved **all 10 findings**, including the critical `next` RCE,
as a lockfile-only change: `next` 16.0.3→16.3.4 (in-range minor), `cypress`
resolved to the already-declared 15.21.0. `package.json` itself did not change.

## What was done (2026-09-10, branch `chore/npm-audit-fix`)

- `npm audit fix` → `found 0 vulnerabilities`. Only `package-lock.json` changed.
- Verified: `typecheck` clean, `lint` 0 errors (same 37 pre-existing warnings),
  `lint:css` clean, `api:spec:check` + `api:types:check` still pass (js-yaml's
  fix didn't break the spec-sync tooling), `test:unit` 464/464,
  `test:integration` 79/79, `npm run build` succeeded with all expected routes
  including the `@modal` interception routes.
- Not run locally: `test:e2e` (needs a running app + Cypress env) — left for CI's
  `E2E tests` job to confirm, since that's the one that would catch a Cypress
  15 behavioral break.

## Checklist

- [x] Run plain `npm audit fix` on a dedicated branch off `dev`.
- [x] Verify `lint`, `typecheck`, `test:unit`, `test:integration`, `api:spec:check`, `api:types:check`, `build`.
- [x] Confirm no `next` or `cypress` major bump was actually required — both were already in-range in `package.json`.
- [ ] Confirm `Security Scan` job goes green in CI.
- [ ] Confirm `E2E tests` job passes in CI (first real check of the Cypress 15 resolution under `test:e2e`).
- [ ] Close out `2026-08-22-todo-cypress-security-upgrade.md` once CI confirms — its concern (cypress major bump risk) is resolved by this change.

## Status

Lockfile fix done and locally verified on `chore/npm-audit-fix`; open a PR and
confirm CI (especially `E2E tests`) before closing this out.
