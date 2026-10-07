# 2026-10-04 - Todo: P2 findings from the 2026-10-04 re-audit

**Context:** findings N4 to N11 of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md), section 6. Each is small and
independent; pick them off singly.

## Checklist

- [x] N4: production CSP has `script-src 'unsafe-inline'` (`next.config.ts`). A per-request nonce,
      or record the deviation. A CSP change needs an ADR. Done 2026-10-05: nonce, ADR-0026, kit
      `csp-script-nonce`
- [ ] N5: ratchet the global coverage thresholds in `jest.config.ts` to just under measured
      (37/42/32/36), and correct the sentence in `CLAUDE.md` § Known state of the repo
- [x] N6: the three telemetry routes read the whole body before the size test, count characters
      rather than bytes, and log without a rate limit. Done 2026-10-06: a streamed byte cap and a
      per-process budget, kit `telemetry-log-hardening`. A per-client limit still waits on hosting
- [x] N7: free text reaches stdout unscrubbed; `scrubText` runs on the Sentry path only. Done
      2026-10-06: scrubbed in the logger, ADR-0027, same kit
- [ ] N8: `dompurify` is in `dependencies` and nothing imports it
- [ ] N9: `docs/reference/commands.md` says it is checked against `package.json`; add the check or
      change the sentence
- [ ] N10: a test that compares `PUBLIC_API_PATHS` with the unsecured operations in the contract
- [ ] N11: stale statements in `src/lib/monitoring/scrub.ts` (`sendDefaultPii`),
      `src/lib/auth-paths.ts` ("derives its `config.matcher`") and
      `docs/reference/ci-pipeline/backend-handoff.md` (staging "active")
- [ ] `vizKeys.dashboard` still has no invalidator (carried from the 2026-08-29 run)

## Status
