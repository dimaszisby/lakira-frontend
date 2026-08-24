# SaaS-Readiness Iteration Plan

**Owner:** @dimaszisby (single-developer)
**Cadence:** iterative; no fixed deadline. Each phase is a self-contained PR off `dev`.
**Source of truth for gaps:** [`audit-2026-08-24.md`](./audit-2026-08-24.md), referenced by
section (e.g. §4.11) and entry title.
**Source of truth for the binary fork-ready gate:** ADR-001 in [`decisions.md`](./decisions.md).

This is the master roadmap for closing the 8 P0 + 21 P1 + 8 P2 items in the baseline audit.

## Phase index

| #   | Phase                         | Closes                                    | Effort | Status          | Gating ADR             |
| --- | ----------------------------- | ----------------------------------------- | ------ | --------------- | ---------------------- |
| 0   | Kit + baseline audit          | — (establishes the trail)                 | S      | Done 2026-08-24 | ADR-001, 002, 003, 004 |
| 1   | Forkability scaffolding       | §4.13 all; §4.6 Node pin                  | M      | Done            | —                      |
| 2   | De-branding + white-label     | §4.13 branding, API tooling; §4.3 favicon | M      | Done            | —                      |
| 3   | Env validation + DX           | §4.6 all                                  | M      | Next            | —                      |
| 4   | Observability                 | §4.5 all; §4.4 CSP sink; §4.10 RUM        | M      | Scaffolded      | —                      |
| 5   | Auth lifecycle                | §4.1 all; §4.2 proxy allowlist            | L      | Scaffolded      | —                      |
| 6   | Multi-tenancy UI              | §4.11 all                                 | L      | Blocked on 5    | **ADR-004**            |
| 7   | Testing, gates, CI/CD, deploy | §4.7, §4.8, §4.9 all                      | L      | Scaffolded      | ADR-003                |
| 8   | Re-audit + closeout           | —                                         | S      | Scaffolded      | ADR-002                |

Status legend: Scaffolded = planned, no code · Next = up now · Blocked = a predecessor
must land first · Done = all phase targets closed.

## Recommended execution order

1. **Phase 1 first.** `LICENSE` alone satisfies half of fork-ready criterion #4 and is
   ~5 minutes of work. The whole phase is S/M-effort paperwork with no behavioural risk.
2. **Phase 2 next**, while the tree is still small. De-branding touches 28 files; every phase
   after this one adds more brand surface, so doing it late costs more. It also breaks
   `cypress/e2e/home.cy.ts:7`, which asserts on a brand string — fix that assertion here.
3. **Phase 3** before 4 and 5. Both add environment variables (Sentry DSN, auth endpoints);
   adding them after the schema exists is cheaper than retrofitting.
4. **Phase 4** before 5, so the auth work lands with error monitoring already watching it.
5. **Phase 5** before 6. Refresh-token handling is the substrate the org switcher sits on —
   `/auth/switch-org` returns a new token, so switching orgs _is_ a token exchange.
6. **Phase 6 last of the feature work, and never partially.** See ADR-004. The org dimension
   must reach all six `keys.ts` factories in one change.
7. **Phase 7** can interleave from Phase 2 onward — the vacuous-gate fixes have no dependency
   on the feature phases, and raising coverage thresholds _before_ the big phases means the new
   code arrives with real gates already in place. Deploy config should wait until Phase 3 has
   settled the env story.
8. **Phase 8** once P0 count reaches zero.

## Unblock recorded ahead of Phase 1

`.gitignore:38` carried a blanket `.env*` that also ignored `.env.example`, making fork-ready
criterion #4 unsatisfiable. Resolved on the Phase 0 branch by adding `!.env.example` at
`.gitignore:39`. Verified with `git check-ignore -v .env.example`.

Note for the record: the global agent hook at `~/.claude/hooks/protect-files.sh` **explicitly
exempts** `.env.example` ("a committed template (no secrets) and is always allowed"), despite
`.claude/rules/environment.md` stating that Claude cannot edit `.env*` files. The rule is
overbroad; correct it when Phase 3 touches that file.

## Progress since the baseline

Phase 1 closed the whole of §4.13 except the branding footprint (Phase 2 owns that) and the
Node pin from §4.6. `LICENSE` and `.env.example` are both present, so **ADR-001 criterion 4
now passes**. The dated audit and `SAAS-BASE-CHECKLIST.md` still show the 2026-08-24 numbers by
design — they are that run's immutable record. The scorecard moves at the next dated audit.

`scripts/bootstrap-fork.sh` was verified end to end on a throwaway clone, not just written: the
forked tree passes `lint`, `lint:css`, `typecheck`, `test:unit`, `test:integration` and `build`
after `npm ci`. Two bugs were found and fixed during that verification — the script rewrote its
own replacement patterns, and a re-run clobbered `FORKED-FROM.md`. The backend's caveat C1 was
exactly this class of defect going unnoticed.

Phase 2 centralized the brand into `src/constants/app.ts` and mapped `constants` in the ESLint
boundary map, which had been unmapped. The fork surface fell from 115 files to 93. `robots.ts`
and `sitemap.ts` moved to Phase 3, which owns the env work they depend on.

## P2-only items (deferred, not scaffolded)

- §4.4 — `secure: true` unconditional (documented as intentional; flagged for forker awareness only)
- §4.8 — `CODECOV_TOKEN` wiring
- §4.11 — subscription / plan surface (the backend defers its equivalent too)
- §4.12 — 43-warning lint backlog
- §4.12 — `npm run format` red on 110 files; needs an isolated whitespace-only PR
- §4.13 — `SECURITY.md`, `CODE_OF_CONDUCT.md`

## Maintenance rules

- **Append-only.** Finished phases keep their row; status flips to Done with a PR link.
- **One mutable surface per file.** In this file it is the Status column. In the kit it is
  `SAAS-BASE-CHECKLIST.md`. Dated audits are immutable.
- **Re-audit after each phase** that closes a P0: write a new dated `audit-YYYY-MM-DD.md`, diff
  its scorecard against this baseline, and update the root checklist.
- **Cross-link bidirectionally.** Any kit opened under `docs/internal/initiatives/` for a phase
  references this file; this file references the kit.

## Audit history

- `audit-2026-08-24.md` — baseline: 34 pass / 18 partial / 27 missing across 79 items (43%). 8 P0, 21 P1,
  8 P2. **NOT FORK-READY** — all four ADR-001 criteria fail. Seven of eight empirical gates
  green; `api:spec:check` red.
