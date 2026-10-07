# 2026-10-04 - Todo: P2 findings from the 2026-10-04 re-audit

**Context:** findings N4 to N11 of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md), section 6. Each is small and
independent; pick them off singly.

## Checklist

- [x] N4: production CSP has `script-src 'unsafe-inline'` (`next.config.ts`). A per-request nonce,
      or record the deviation. A CSP change needs an ADR. Done 2026-10-05: nonce, ADR-0026, kit
      `csp-script-nonce`
- [x] N5: ratchet the global coverage thresholds in `jest.config.ts` to just under measured
      (37/42/32/36), and correct the sentence in `CLAUDE.md` § Known state of the repo. Done
      2026-10-07: 42/43/37/41 against a measured 43.54/44.32/38.01/42.55
- [x] N6: the three telemetry routes read the whole body before the size test, count characters
      rather than bytes, and log without a rate limit. Done 2026-10-06: a streamed byte cap and a
      per-process budget, kit `telemetry-log-hardening`. A per-client limit still waits on hosting
- [x] N7: free text reaches stdout unscrubbed; `scrubText` runs on the Sentry path only. Done
      2026-10-06: scrubbed in the logger, ADR-0027, same kit
- [x] N8: `dompurify` is in `dependencies` and nothing imports it. Done 2026-10-07: removed, and
      `react/no-danger` is a lint error, ADR-0028
- [x] N9: `docs/reference/commands.md` says it is checked against `package.json`; add the check or
      change the sentence. Done 2026-10-07: `src/__tests__/commands-doc.test.ts`
- [x] N10: a test that compares `PUBLIC_API_PATHS` with the unsecured operations in the contract.
      Done 2026-10-07, in `src/lib/__tests__/auth-paths.test.ts`
- [x] N11: stale statements in `src/lib/monitoring/scrub.ts` (`sendDefaultPii`),
      `src/lib/auth-paths.ts` ("derives its `config.matcher`") and
      `docs/reference/ci-pipeline/backend-handoff.md` (staging "active"). Done 2026-10-07: the
      first and third corrected; the second was already gone, as was the
      `scripts/bootstrap-fork.sh` one the audit listed. `SECURITY.md` still described N6 as open
      after #75 and is corrected too
- [x] `vizKeys.dashboard` still has no invalidator (carried from the 2026-08-29 run). Done
      2026-10-07: `invalidateDashboardVisualizations`, called by fifteen mutations

## Status

Every box is ticked as of 2026-10-07. N4 landed in #74, N6 and N7 in #75, and the rest in kit
[`reaudit-p2-sweep`](../initiatives/reaudit-p2-sweep/README.md). The scorecard does not move until
the next dated run. What that run still cannot change: the CI/CD criterion, which waits on
hosting.
