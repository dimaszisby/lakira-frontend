# Run a security audit

Audits are run as dated cycles. Each produces a folder of structured records under
`docs/internal/audits/security/audit-<YYYY-MM-DD>/`.

## Automated scans first

```bash
npm run security:scan        # lint + lint:css + the production audit
npm run security:audit       # npm audit --omit=dev --audit-level=high
npm run security:audit:full  # npm audit --audit-level=high, every dependency
```

`security:scan` runs in CI on every push and pull request as the `security` job, alongside a
gitleaks `secret-scan`. It blocks on production dependencies only; `security:audit:full` runs
nightly in the `dependency-audit` workflow, where an advisory in development tooling surfaces
([ADR-0023](../../explanation/decisions/adr-0023-pull-requests-block-on-production-advisories-only.md)).

## Then the manual cycle

1. **Branch.** One branch per audit cycle, off `dev`.
2. **Create the run folder**, `docs/internal/audits/security/audit-<YYYY-MM-DD>/`.
3. **Copy the structure of the previous run.** `audit-2025-11-21/` is the fullest example:
   `security-audit-plan.md`, `security-audit-log.md`, `threat-model.md`, `control-matrix.md`,
   plus the baseline and feature overview logs.
4. **Work the plan**, recording each finding in the log as you go, with evidence.
5. **Update the control matrix** with the status of each control.
6. **Open a remediation tracker** for anything unresolved — see `audit-2025-12-10/`.

## Never reformat an audit record

Files under `docs/internal/audits/security/**` are structured records. Condensing, reflowing, or
"tidying" them destroys required detail, and the rule is enforced in
`.claude/rules/documentation.md`. Append; do not rewrite.

## What the app already does

Worth knowing before auditing, so you test the right things:

- Session token in an httpOnly cookie (`lakira_token`), never readable from JavaScript.
- All backend traffic through `/api/proxy/[...path]`, which attaches the `Authorization` header
  server-side.
- Proxy auth is **deny-by-default** (`PUBLIC_API_PATHS` in `src/lib/auth-paths.ts`). Check that anything added there is genuinely unauthenticated in the OpenAPI contract.
- Full CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Frame-Options, and nosniff set in
  `next.config.ts`, with violations reported to `/api/security/csp-report`.
- `connect-src` derived from `NEXT_PUBLIC_API_BASE_URL`'s origin.

## Related

- [`../../internal/audits/security/`](../../internal/audits/security/) — previous runs
- [`../../../.claude/rules/security.md`](../../../.claude/rules/security.md)
