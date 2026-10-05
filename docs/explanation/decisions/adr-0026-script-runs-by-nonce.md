# ADR-0026 — Script runs by per-request nonce; the policy no longer allows inline script

- **Status:** Accepted
- **Date:** 2026-10-05
- **Origin:** `D-01` in the csp-script-nonce kit — [`decisions.md`](../../internal/initiatives/csp-script-nonce/decisions.md)

---

## Context

The Content Security Policy was a static header in `next.config.ts` with
`script-src 'self' 'unsafe-inline'` in production. Next and `next-themes` emit inline scripts, and
`'unsafe-inline'` was what let them run. It also let any injected inline script run, so the policy
gave no protection against the attack it is mainly for. The 2026-10-04 readiness audit recorded
this as finding N4.

Next's supported alternative is a nonce generated per request in the proxy file: Next reads it
from the request's `Content-Security-Policy` header and stamps it on the scripts it emits
(`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).

## Decision

`src/proxy.ts` generates a nonce for every page request and sets
`script-src 'self' 'nonce-<nonce>' 'strict-dynamic'`, built by `src/lib/csp.ts`. Development adds
`'unsafe-eval'`, which React needs there; production never has it.

- The proxy's matcher covers every path except `/api`, `/_next/static` and `/_next/image`, each
  excluded at a segment boundary so that a page at `/api-docs` is still covered. The excluded paths
  keep a static policy from `next.config.ts`, without `'unsafe-inline'`. A unit test fails if that
  policy and the builder differ in any directive but `script-src`.
- The root layout reads the nonce and passes it to `next-themes`, the one inline script Next does
  not stamp itself.
- `npm run test:e2e:csp` runs Cypress with the real header enforced and is a step in CI's `e2e`
  job. Cypress strips CSP headers by default, so no other suite would notice a broken policy.

## Options considered

- **Subresource Integrity.** Experimental in Next, and it does not cover inline scripts.
- **Keep `'unsafe-inline'` and record it as a deviation.** The nonce costs two pages their static
  rendering; that is cheap for what it buys.
- **Hashes for the known inline scripts.** Next's inline payloads change per page and per build.

## Consequences

- Every page is rendered per request. `/forgot-password` and the 404 page were the last static
  ones. Static generation, ISR and Partial Prerendering are not available while this stands.
- The edge session gate runs on every page request. Its decisions are unchanged; which paths it
  protects is still `PROTECTED_APP_PATHS`, checked inside the function.
- Any inline script added to the app needs the nonce, read from the `x-nonce` request header. One
  without it is blocked, and the page it belongs to may not hydrate.
- `style-src` still allows inline styles. That is a recorded, narrower exposure, not an oversight.
- `'strict-dynamic'` trusts a script element created by script that is already trusted. Measured in
  a browser enforcing this policy: an injected inline event handler and a `javascript:` URL are
  blocked; a script element built with `createElement` runs. The policy stops injected markup from
  executing. It does not stop application code that builds a script from untrusted data.
- The browser test keeps `default-src`, `script-src`, `script-src-elem` and `form-action` enforced.
  A mistake in `style-src`, `connect-src` or `img-src` is not something it is known to catch.
- An upgrade of Next, React or `next-themes` can change which scripts are emitted. The CSP e2e
  step is what notices.

## References

- [`../../internal/audits/saas-readiness/audit-2026-10-04.md`](../../internal/audits/saas-readiness/audit-2026-10-04.md) § 6, N4
- [ADR-0025](./adr-0025-the-proxy-sets-the-session-cookie.md) — the token no longer reaches script either
- [`../../internal/initiatives/csp-script-nonce/`](../../internal/initiatives/csp-script-nonce/)
