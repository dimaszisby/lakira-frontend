# SaaS Base Readiness

## Overview

This kit holds the SaaS-base readiness audit for the Lakira **frontend** — a graded,
file-path-precise assessment of how close the repo is to being **forkable as a generic SaaS
frontend base** rather than a personal-app codebase.

The audit grades against the project's own intended standard (`.claude/rules/*`,
`docs/explanation/testing-strategy.md`, `docs/reference/performance-budget.md`,
`docs/reference/accessibility-baseline.md`) and not just generic SaaS criteria. Empirical
verification commands are run; a category cannot be Pass if its verification fails or if the
intended standard itself is missing.

It mirrors the equivalent kit in `lakira-backend`
(`docs/internal/audits/saas-readiness/`), adapted to a Next.js App Router frontend.

## Scope

- **In scope:** structural readiness (auth/session, contract consumption, rendering, security,
  observability, DX, testing, CI/CD, accessibility, performance, multi-tenancy surface,
  architecture, forkability) and drift between what the rules claim is enforced and what is.
- **Out of scope:** the backend codebase, visual/UX design critique, load testing, and deep
  dependency CVE triage (the `security:scan` gate covers that).

## Files in this kit

- `README.md` — this file.
- `audit-2026-08-24.md` — baseline audit. Scorecard, gap entries (P0/P1/P2), evidence,
  recommended fixes.
- `audit-2026-08-29.md` — re-audit after phases 0-7. 43% -> 84%; FORK-READY WITH CAVEATS.
- `FINAL-AUDIT-SUMMARY.md` — closeout across both runs, including the findings the programme
  itself got wrong and corrected.
- `iteration-plan.md` — phase roadmap mapping each remediation phase to its gap IDs and kit.
- `decisions.md` — ADR entries for standards adopted in response to the audit. New decisions
  append at the bottom; do not rewrite history.

The repo-root `SAAS-BASE-CHECKLIST.md` is the public, consumer-facing one-pager: verdict +
scorecard + top gaps. It links here for detail and is the **only mutable surface**.

## How to read the gap entries

Each non-Pass item follows the same structure:

- **Status** — PARTIAL or MISSING.
- **What's missing/incomplete** — 1–3 sentences, no soft pedalling.
- **Why it matters for a SaaS base** — the reason it's worth fixing for a forker.
- **Recommended fix** — opinionated, picks a specific lib/pattern fitting the existing stack.
- **Effort** — S (≤ ½ day) / M (1–3 days) / L (> 3 days).
- **Evidence** — exact `file:line` or "no file found".

## Severity tags

- **P0** — blocks "fork-ready" status. Security holes, missing license, no `.env.example`,
  no README, no tenant representation.
- **P1** — should be fixed before recommending the base externally.
- **P2** — nice-to-have.

## Fork-ready exit criteria

See ADR-001 in [`decisions.md`](./decisions.md). All four must hold:

1. Zero P0 gaps remaining.
2. All eight empirical gates green.
3. Categories 1 (Auth), 4 (Security), 6 (DX), 7 (Testing), 8 (CI/CD), 11 (Multi-Tenancy),
   13 (Forkability) at ≥ 80% Pass.
4. `LICENSE` and `.env.example` present at repo root.

## Re-running this audit

```bash
npm run lint
npm run lint:css
npm run typecheck
npm run test:unit:ci
npm run coverage:check
npm run test:integration
npm run build
npm run api:spec:check && npm run api:types:check
npm run security:scan
```

`test:unit:ci` rather than `test:unit`: it collects coverage, which the thresholds gate on.
`coverage:check` enforces the per-folder goals and runs in CI as of 2026-08-27.

Capture real exit codes. A category cannot be Pass if any gate covering it fails.

Then write the result to a **new** dated file `audit-YYYY-MM-DD.md` in this folder — do not
overwrite a prior audit — and update `SAAS-BASE-CHECKLIST.md` to point at it. Diff the
scorecards across runs to track progress.

### Supplementary scans

```bash
# Branding footprint
grep -rIl 'lakira\|Lakira' src public package.json cypress middleware.ts scripts

# Env reads not routed through a schema
grep -rn 'process\.env' src middleware.ts next.config.ts

# Cache keys missing an org dimension
find src/features -name keys.ts -exec grep -L 'organization\|orgId' {} +

# Gates that pass vacuously
grep -n 'coverageThreshold' -A6 jest.config.ts

# Every org-scoped key factory must take organizationId as a required first
# argument, so a missed call site is a compile error rather than a silent leak.
find src/features -name keys.ts -exec grep -L 'organizationId' {} +   # expect only auth/keys.ts
```

The MSW scan from the baseline is retired: `handlers.ts` being empty is correct design, not a
gap. See the correction in `FINAL-AUDIT-SUMMARY.md` section 3.

## References

- `.claude/rules/` — the intended standard.
- `.claude/lessons.md` — two logged instances of documented-but-unenforced gates.
- `docs/explanation/testing-strategy.md`
- `docs/reference/api/lakira-backend-openapi.json` — the backend contract.
- `docs/internal/incidents/` — four postmortems on routing, caching, prefetch, `searchParams`.
- Sibling kit: `lakira-backend/docs/internal/audits/saas-readiness/`.
