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

## Why this is its own task

The `next` bump is critical-severity RCE and the highest-value fix, but a Next
major/minor bump on a Next-16 App Router codebase (parallel `@modal` routes,
route interception, `middleware.ts` auth gating) needs its own verification —
not something to fold into an unrelated PR. The `cypress` major bump (from the
linked prior todo) needs a separate E2E pass for the same reason. The rest are
plain `npm audit fix` (non-breaking, lockfile-only) and can land together first
to shrink the list fast.

## Checklist

- [ ] Run plain `npm audit fix` (non-breaking) on a dedicated branch off `dev` — covers browserslist, fast-uri, js-yaml, sharp, @humanfs/node, colord, qs, postcss-selector-parser.
- [ ] Verify after: `lint`, `typecheck`, `test:unit`, `test:integration`, and specifically `npm run api:spec:sync` / `npm run api:types:generate` (js-yaml is a transitive dep of the spec-sync tooling).
- [ ] Handle `next` critical RCE as its own step: check current pinned version, target fixed version, diff against Next 16 App Router / middleware / parallel-route usage, run full local `npm run dev` smoke pass.
- [ ] Fold in or close out the cypress major bump from the prior todo (`npm audit fix --force`, `test:e2e`).
- [ ] Confirm `Security Scan` job goes green in CI.
- [ ] Confirm `E2E tests` and `Build` jobs still pass in CI.
- [ ] Close out or update `2026-08-22-todo-cypress-security-upgrade.md` once its portion lands.

## Status

Not started.
