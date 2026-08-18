---
paths:
  - next.config.ts
  - middleware.ts
  - src/app/api/**
  - src/services/api/**
  - src/features/auth/**
  - src/lib/sanitizeErrorMessage.ts
---

# Security

Audit history: [`documents/security/audit/`](../../documents/security/audit/).

## Auth and session

The session is a single **httpOnly** cookie, `lakira_token`: `sameSite: lax`, `secure: true`, 7-day max age, path `/`. Set and cleared by `src/app/api/auth/*`.

Non-negotiables:

- **The token never touches JavaScript.** Not `localStorage`, not `sessionStorage`, not a non-httpOnly cookie, not a global. If a component appears to need the token, it needs a server route instead.
- **The bearer header is injected by the proxy**, from the cookie. Feature code never sets `Authorization`.
- `middleware.ts` gate-checks the cookie for `/dashboard`, `/metrics`, `/metric-categories`, `/account`. Adding a protected top-level route means adding it there — the gate is not inferred from the folder structure.

`secure: true` is unconditional, so the cookie will not be set over plain `http`. That is intentional; work around it in local dev with the documented setup rather than by weakening the flag.

## The proxy's auth allowlist

`src/app/api/proxy/[...path]/route.ts` requires a token only when the first path segment is `metrics`, `metric-categories`, `metric-logs`, `metric-settings`, or `users`. Everything else — including `analytics/*` — passes through unauthenticated (the token is still forwarded if present).

**When adding a backend resource that requires auth, add its segment to that list.** A missing segment means an endpoint that looks protected and is not.

## Content Security Policy

Defined in `next.config.ts` alongside HSTS, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`. Violations report to `/api/security/csp-report`.

`connect-src` is derived from `NEXT_PUBLIC_API_BASE_URL`, and `unsafe-eval` is dev-only. Any new external origin — an image host, an analytics endpoint, a font CDN — needs an explicit CSP entry. Do not widen a directive to a wildcard to make something work; add the specific origin, and if that feels like too many origins, that is the signal.

## Injection

- **Every string reaching `dangerouslySetInnerHTML` goes through DOMPurify.** No exceptions, including strings that "come from our own backend".
- Error text rendered to users goes through `sanitizeErrorMessage` (`src/lib/sanitizeErrorMessage.ts`) — backend errors can carry paths and internals.
- Never interpolate user input into a URL without encoding it.
- `security/detect-object-injection` is disabled because it is noisy on frontend code. That means dynamic property access is unchecked — be deliberate about it on anything derived from user input.

## Secrets

- No secret ever gets a `NEXT_PUBLIC_` prefix. See `.claude/rules/environment.md`.
- No credentials in the repo, including test accounts for staging. The backend handoff is explicit: staging credentials live only in GitHub/Vercel secrets.
- `gitleaks` runs on full history in CI (`secret-scan` job). A hit there means the secret is already public and must be rotated, not just removed.
- `npm audit --audit-level=high` runs in the `security` job. A new high-severity advisory fails CI.

## Reviewing changes

Use the built-in `/security-review` for a full pass. When reviewing by hand, the checks that catch real issues in this codebase:

1. Does any new route handler read the cookie without validating it?
2. Does a new backend resource need adding to the proxy's auth allowlist?
3. Is a cache key missing a scope that makes one user's data reachable by another?
4. Did a new external origin get added to the CSP, or worked around?
5. Is anything sensitive newly behind a `NEXT_PUBLIC_` name?
