# A nonce for script in the Content Security Policy — Decisions

## D-01 — Script is allowed by a per-request nonce, generated in the proxy

> **Promoted to [ADR-0026](../../../explanation/decisions/adr-0026-script-runs-by-nonce.md)** in the flat
> registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** The production policy allowed inline script because Next and `next-themes` emit some.
That left the policy unable to stop an injected inline script.

**Decision.** `src/proxy.ts` generates a nonce for every page request and sends
`script-src 'self' 'nonce-<nonce>' 'strict-dynamic'`. Next stamps the nonce on its own scripts; the
root layout passes it to `next-themes` for the one inline script Next does not own.

**Options considered.**

- _Subresource Integrity (`experimental.sri`)._ Rejected: Next marks it experimental, and it
  covers script files, not the inline scripts that are the reason `'unsafe-inline'` is there.
- _Keep `'unsafe-inline'` and record the deviation._ Rejected: the cost of the nonce here is two
  pages losing static rendering. Every other page is already rendered per request.
- _Hashes for the known inline scripts._ Rejected: Next's inline payloads change per page and per
  build, so the list could not be kept.

**Consequences.** Every page is rendered per request; `/forgot-password` and the 404 were the last
static ones. The edge gate runs on every page request to produce the nonce. A script emitted
without the nonce breaks the page it is on, so the policy needs a browser test that enforces it.

## D-02 — The matcher is one wide pattern; coverage of protected paths is tested

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** The proxy's matcher listed the five protected sections, and a test compared that list
with `PROTECTED_APP_PATHS`. The proxy now also has to run on public pages, to give them a nonce.

**Decision.** `config.matcher` is the single pattern `PROXY_MATCHER` in `src/lib/auth-paths.ts`:
every path except `/api`, `/_next/static` and `/_next/image`. The test asserts the literal in
`src/proxy.ts` equals it, that every protected path and a deeper path under each is matched, and
that route handlers and static output are not.

**Options considered.**

- _Keep the five patterns and add public ones._ Rejected: a new public page would get no nonce
  and, under the new policy, would not hydrate. Opt-out is the safe default here.
- _Add the guide's `missing` prefetch conditions._ Rejected: they skip the proxy for prefetches,
  and the session gate has to see those too.

**Consequences.** The gate function runs on every page request. A public file under `public/` is
matched as well and gets the page policy, which is harmless.

## D-03 — A static policy stays for `/api` and `/_next` only

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** The proxy does not run on route handlers or Next's static output. If `next.config.ts`
kept sending its policy on every path, pages would carry two, and a browser enforces both.

**Decision.** `next.config.ts` sends its Content Security Policy only on `/api/:path*` and
`/_next/:path*`, with `script-src 'self'`. Checked on a production build: a page, an API route, a
static chunk and a public file each carry exactly one policy header.

**Options considered.**

- _No policy on those paths._ Rejected: an API response opened directly in a browser tab would
  have none.
- _One builder shared by both._ Not possible: `next.config.ts` runs before the app's module graph
  exists and cannot import from `src/`. The two are kept in step by comment.

**Consequences.** Two places describe the policy. A directive added to one has to be added to the
other by hand.

## D-04 — The policy is tested in a browser that enforces it, by its own script

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** Cypress removes Content-Security-Policy headers by default. With
`experimentalCspAllowList: true` it still removes `script-src`, found when the first run of the new
spec passed its "no violation" tests and failed to see any injected script blocked.

**Decision.** `cypress.config.ts` sets the allow-list to the directive names
(`default-src`, `script-src`, `script-src-elem`, `form-action`) when `E2E_ENFORCE_CSP=1`.
`npm run test:e2e:csp` sets it and runs `cypress/e2e/csp/`. The spec's first test fails if
`script-src` is not in the allow-list, and its last one fails unless an injected handler is
actually blocked. The step runs in CI's `e2e` job.

**Options considered.**

- _Enforce the policy in every Cypress suite._ Rejected: cypress-axe injects itself with `eval`,
  which the production policy refuses, so the accessibility specs would fail for a reason that is
  not theirs.
- _Lighthouse's console-error audit._ Rejected as the gate: it covers three public routes and
  reports a score, not a failure.

**Consequences.** One more Cypress invocation in CI, a few seconds. Signed-in pages are covered
only by a local run of the stack suite with the same variable set.

## D-05 — `'strict-dynamic'` stays, and what it does not block is written down

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** A probe in a browser enforcing the new policy injected script four ways. An inline
event handler and a `javascript:` URL were blocked. A script element built with `createElement`,
and one from `createContextualFragment`, both ran. `'strict-dynamic'` trusts any script created by
script that is already trusted.

**Decision.** Keep `script-src 'self' 'nonce-…' 'strict-dynamic'`, as Next's guide gives it.

**Options considered.**

- _Drop `'strict-dynamic'`: `script-src 'self' 'nonce-…'`._ It would block the two forms that ran.
  Rejected: it makes `'self'` the rule for script files, so injected markup could load any
  same-origin URL as script, and it depends on Next never creating a script element at run time,
  which no document promises. Whoever can call `createElement` is already running script.

**Consequences.** The policy stops injected markup from executing. It does not stop a flaw in the
app's own code that builds a script element from untrusted data; lint and review have to. The CSP
spec tests the forms that are blocked and says in a comment which one is not.

## D-06 — The matcher's exclusions end at a segment boundary

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** D-02's pattern was written as Next's guide gives it, with bare prefixes:
`(?!api|_next/static|_next/image)`. Review requested `/apiary` from the running build and got a 404
document with no Content-Security-Policy header at all. Any path that merely starts with `api`
was skipped by the proxy, and `next.config.ts` only covers `/api/…`. No such page exists today.

**Decision.** Each exclusion is followed by `(?:/|$)`. The matcher test lists look-alike paths
(`/apiary`, `/api-docs`, `/api.html`, `/_next/staticfoo`, `/_next/images`, `/_nextish`) that must be
matched, beside the real ones that must not.

**Options considered.**

- _Leave it, since no page lives there._ Rejected: the failure is silent and worse than the policy
  this change replaces. A page added at `/api-reference` would have no policy and no nonce.
- _A catch-all static policy as a net._ Rejected: a page the proxy does cover would then carry
  two policies, which is what D-03 avoids.

**Consequences.** The pattern is longer than the one in Next's guide. The copy in `src/proxy.ts`
has to match it character for character, which the test already asserts.
