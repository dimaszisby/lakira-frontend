# SaaS Readiness — Audit Summary

Closeout for the remediation programme run 2026-08-24 to 2026-08-29. Companion to the dated
audits, which are immutable; this file summarises across them and is updated when a new run
lands.

## 1. Executive summary

The frontend went from **NOT FORK-READY at 43%** to **FORK-READY WITH CAVEATS at 84%** in five
days and seven phases, across six merged PRs (#6, #8, #9, #10, #11, plus #7 which fixed a
backend contract defect this work surfaced).

All four ADR-001 criteria pass. The remaining caveats are real and are stated as caveats rather
than rounded away: the organization switcher is blocked on a backend endpoint that does not
exist, three flows are built but unverified for want of email-token access, and there is no
deploy configuration.

## 2. What each phase closed

| Phase | Landed                  | Closed                                                                        |
| ----- | ----------------------- | ----------------------------------------------------------------------------- |
| 0     | Kit + baseline audit    | Established the trail. 79 items graded, 8 P0                                  |
| 1     | Forkability scaffolding | `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `.nvmrc`, `bootstrap-fork.sh`    |
| 2     | De-branding             | `src/constants/app.ts`; fork surface 115 → 93 files                           |
| 3     | Env validation          | `src/lib/env.ts`; the `undefined/auth/login` bug; the three-way port conflict |
| 4a    | Observability           | Structured stdout logging, RUM, CSP sink, the two missing error boundaries    |
| 5a    | Auth hardening          | Deny-by-default proxy, `exp`-checked middleware, validated session route      |
| 5b    | Auth lifecycle          | Refresh-on-401; verify-email, resend, forgot- and reset-password              |
| 6     | Multi-tenancy           | Five org-scoped key factories, members/invites, 94 new tests                  |
| 7     | Gate honesty            | Real coverage thresholds, `coverage:check` in CI, a11y stub removed           |

## 3. Findings the programme got wrong, and corrected

Recorded because a process that only reports successes is not an audit trail.

- **The baseline claimed integration tests mock feature hooks at module level.** False — 12 of
  17 suites use real MSW HTTP mocking and none mocks a hook. The claim originated in `CLAUDE.md`
  and was repeated into the audit rather than verified. Corrected in three places; the empty
  global `handlers.ts` is correct design and _stricter_ than a shared list.
- **The baseline called `login/route.ts` calling the backend directly a proxy bypass.** It is
  not: that route is already server-side, so it is doing what the proxy itself does. Withdrawn.
- **Phase 1 shipped `.env.example` with the wrong port.** `:4000` came from reference prose;
  `:8001` is what the two guides validated by running them verbatim use, and it exists to dodge
  a macOS AirPlay clash on the backend's default of 5000. Corrected in Phase 3.
- **Phase 6's plan put the organization id at key index 0.** Wrong: `data-visualizations/cache.ts`
  matches by position, and index 0 would have made its predicate match nothing — cross-org data
  silently never invalidating. Isolation comes from the id being present at all; position only
  decides invalidation correctness. Moved to index 1 before implementation.
- **Phase 5b's refresh cookie was first scoped to `/api/auth`.** The proxy that redeems it is at
  `/api/proxy`, so the browser never sent it. Caught only by testing against a live backend; no
  unit test would have found it.

## 4. Two contract defects found in the backend

Both were invisible until a consumer tried to use the surface.

- **Dangling `$ref`** — `TooManyRequestsError` was referenced by two paths and never defined,
  which crashed `openapi-typescript` and held the `api-contract` job red. Fixed in the backend
  and merged as frontend PR #7. It shipped undetected because the backend's `docs:openapi:check`
  only diffs generated against committed, and both held the same broken ref.
- **No way to enumerate a user's organizations** — no `GET /organizations`, no memberships on
  `User`. Blocks the switcher. Handoff written, not yet actioned.

The backend's spec generation still does not validate that `$ref`s resolve, so the first class
of defect can recur.

## 5. Verification standard applied

Where a guard was added, it was checked to fail:

- Coverage thresholds: set to 95% temporarily → exit 1 with the expected message; restored → pass.
- Middleware matcher drift test: changed `/account` to `/billing` → test failed; restored → passed.
- Org key scoping: removed the id from `vizKeys` → 10 tests failed; moved it to the tail → 16
  failed including the prefix test; restored → all 87 passed.
- MSW harness: a probe making an undeclared request produced the expected unhandled-request error.
- `bootstrap-fork.sh`: run end to end on throwaway clones. Found two real defects — it rewrote
  its own replacement patterns, and a re-run clobbered `FORKED-FROM.md`.

## 6. What is left

|                             | Owner            |                                                                   |
| --------------------------- | ---------------- | ----------------------------------------------------------------- |
| C1 — organization switcher  | Backend          | Needs `GET /organizations` or memberships on `User`               |
| C2 — three unverified flows | Either           | Needs the backend's stdout or an inbox                            |
| C3 — vendor error sink      | Product decision | `setLogSink()` is the seam; ~20 minutes once a provider is chosen |
| C4 — deploy config          | Product decision | Needs a hosting choice                                            |
| C5 — `gitleaks-action` v1   | Frontend         | Small                                                             |
| C6 — six quarantined files  | Frontend         | `HydrateUser.tsx` is dead code and can simply go                  |

## 7. Related

- [`audit-2026-08-24.md`](./audit-2026-08-24.md) — baseline, immutable
- [`audit-2026-08-29.md`](./audit-2026-08-29.md) — current run, immutable
- [`decisions.md`](./decisions.md) — ADR-001 through ADR-004
- [`iteration-plan.md`](./iteration-plan.md) — phase roadmap and status
- [`../../../../SAAS-BASE-CHECKLIST.md`](../../../../SAAS-BASE-CHECKLIST.md) — the public one-pager
