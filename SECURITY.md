# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report privately through GitHub's
[private vulnerability reporting](https://github.com/dimaszisby/lakira-frontend/security/advisories/new)
on this repository. If that is unavailable, contact the maintainer directly through their
GitHub profile.

Please include:

- What the issue is and where (file path, route, or request that triggers it).
- What an attacker could achieve with it.
- Steps to reproduce, or a proof of concept.
- Any suggested fix, if you have one.

This project is maintained by a single developer. Acknowledgement is best-effort, typically
within a week. There is no bug-bounty programme.

## Scope

This repository is the **frontend** — a Next.js App Router application. The backend API it
pairs with lives at [`lakira-backend`](https://github.com/dimaszisby/lakira-backend) and has
its own policy; report server-side issues there.

In scope here:

- Session-cookie handling and the `/api/auth/*` routes.
- The backend proxy at `/api/proxy/[...path]`, including its authentication allowlist.
- Content Security Policy and the security headers in `next.config.ts`.
- Cross-site scripting, including anything reaching `dangerouslySetInnerHTML`.
- Client-side exposure of data that should be server-only.
- Dependency vulnerabilities reachable from application code.

Out of scope:

- Findings that require a compromised or physically present device.
- Missing headers or configuration with no demonstrated impact.
- Automated scanner output without a working proof of concept.
- Denial of service through volumetric traffic.
- Issues in the staging backend deployment rather than this codebase.

## Known gaps

This repo publishes its own readiness assessment rather than implying it has none. See
[`SAAS-BASE-CHECKLIST.md`](SAAS-BASE-CHECKLIST.md) and the dated audit under
`docs/internal/audits/saas-readiness/`.

Security-relevant items already known and tracked — please do not re-report these:

- No error monitoring is wired up; CSP violation reports are received and discarded in
  production.
- `middleware.ts` performs a presence-only session-cookie check and does not validate token
  expiry.
- The proxy's authentication allowlist is opt-in by path segment, so `analytics/*` proxies
  unauthenticated.
- `/api/auth/session` accepts a token string without validating it against the backend.
- There is no environment-variable validation.

A **fork** of this repository inherits all of the above. Read the checklist before deploying
one.

## Handling practices

- Secrets never enter the repository. `gitleaks` runs over full history in CI; a hit means the
  secret is already public and must be rotated, not merely deleted.
- `npm audit --audit-level=high` gates CI. A new high-severity advisory fails the build.
- Nothing sensitive goes behind a `NEXT_PUBLIC_` name — that prefix inlines the value into the
  client bundle at build time and publishes it permanently. See `.claude/rules/environment.md`.
