# A nonce for script in the Content Security Policy — Plan

- **Status:** Done
- **Appetite:** 1 day — past that, ship the nonce without the CI step and file the step as a todo
- **Date:** 2026-10-05

## Context and goals

`next.config.ts` sends `script-src 'self' 'unsafe-inline'` in production. A policy that allows
inline script does not stop an injected one, which is the main thing a Content Security Policy is
for. Nothing recorded this as a deliberate deviation.

`'unsafe-inline'` is there because Next and `next-themes` emit inline scripts. Next's supported way
to drop it is a per-request nonce generated in `src/proxy.ts`
(`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).

When this lands, pages are served with `script-src 'self' 'nonce-…' 'strict-dynamic'`, and a
browser test that enforces the real header fails if a page stops working under it.

## Acceptance criteria

- **AC-1** — A production page response carries a CSP whose `script-src` has a nonce and
  `'strict-dynamic'`, and no `'unsafe-inline'`.
  _Why:_ audit 2026-10-04 N4.
- **AC-2** — Two requests receive two different nonces.
  _Why:_ a nonce that repeats can be read once and reused; the Next guide requires a fresh one per
  request.
- **AC-3** — Every `<script>` element in the served HTML of `/login` carries that response's nonce.
  _Why:_ one script without it stops the page hydrating; lesson 2026-09-12, prove the mechanism
  runs.
- **AC-4** — No response carries two `Content-Security-Policy` headers, and an API response keeps a
  CSP without `'unsafe-inline'`.
  _Why:_ two policies are both enforced, so a leftover static one would silently change what is
  allowed.
- **AC-5** — The session gate behaves as before on all five protected sections: no cookie goes to
  `/login` with a `returnUrl`, an unusable token goes to revive, a usable one passes.
  _Why:_ the matcher that scopes the gate changes; the 2026-09-12 lesson is that a gate which
  fails open into the layout's redirect shows no symptom.
- **AC-6** — In a real browser with the header enforced, `/`, `/login`, `/register` and
  `/forgot-password` hydrate and report no violation, and the theme attribute is set.
  _Why:_ Cypress strips CSP headers by default, so no existing suite would notice a broken policy.
- **AC-7** — The signed-in pages work in a real browser with the header enforced.
  _Why:_ they carry the app shell and every data-driven component; kit `cypress-a11y-e2e` D-01
  keeps them out of CI, so this is a local run.
- **AC-8** — `'unsafe-eval'` is present in development and absent in production.
  _Why:_ React needs it in development (Next guide); shipping it would reopen a hole this closes.
- **AC-9** — An inline script injected without the nonce is blocked in a real browser.
  _Why:_ this is the property the change exists to provide; AC-1 only shows the header says so.

## Open questions

None.

## Out of scope

- `style-src` keeps `'unsafe-inline'`. React inline styles and `next/font` would need their own
  work, and style injection is a far smaller risk than script.
- Subresource Integrity, which Next marks experimental.
- The cold-load theme flash (`2026-09-24-todo-cold-load-paint-before-theme-script.md`).

## Decisions expected

- D-01 — nonce in the proxy, or SRI, or record the deviation. Settled in planning; ADR-0026.
- D-02 — what the gate's matcher becomes, and how its coverage is tested once it no longer equals
  the protected-path list.
- D-03 — which routes keep a static CSP from `next.config.ts`.
- D-04 — how the enforced-header browser test runs, given Cypress's default.

D-05 (what `'strict-dynamic'` does not block) came from a probe during Phase 3, and D-06 (the
matcher's exclusions need a segment boundary) from review. Neither was foreseen.

## Phases

### Phase 0 — Kit and baseline

This kit, ADR-0026 as `Proposed`, and a Lighthouse and response-time baseline on `dev`.

### Phase 1 — Policy and proxy

`src/lib/csp.ts`; `src/proxy.ts` generates the nonce and sets the headers; the matcher widens;
`next.config.ts` keeps the static CSP for `/api` and `/_next` only. Tests first, watched failing.

### Phase 2 — The one inline script Next does not stamp

`src/app/layout.tsx` reads `x-nonce` and passes it through `Providers` to `ThemeProvider`.

### Phase 3 — The mechanism

`cypress/e2e/csp/`, `npm run test:e2e:csp`, the CI step, `docs/reference/commands.md`.

### Phase 4 — Verify, review, docs

## Risks and trade-offs

- A script Next or a library emits without the nonce stops a page hydrating. AC-6 and the CI step
  exist to catch it now and after every upgrade.
- `/forgot-password` and the 404 page lose static rendering. Every other page is already dynamic.
- The gate now runs on every page request, including public ones. It is a few string comparisons.

## Rollback

Revert the PR. The static header returns and the matcher narrows again. Nothing is stored.

## Security and data

This tightens a trust boundary and widens where the edge gate runs. The gate's decisions are
unchanged (AC-5). The nonce is random per request and is not a secret beyond that request. No new
data is logged; a violation is already reported to `/api/security/csp-report`.

## Observability

`csp.violation` at `warn` on stdout, from the existing report endpoint. After deploy, a rise in it
is either an attack or a script that lost its nonce; the `violatedDirective` and `blockedUri`
fields tell them apart.

## References

- `docs/internal/audits/saas-readiness/audit-2026-10-04.md` § 6, N4
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`
- ADR-0022 (browser accessibility checks with cypress-axe), ADR-0024, ADR-0025
