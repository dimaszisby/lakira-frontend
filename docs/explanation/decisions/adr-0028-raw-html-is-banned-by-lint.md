# ADR-0028 — The app renders no raw HTML; lint bans it and no sanitiser is installed

- **Status:** Accepted
- **Date:** 2026-10-07
- **Origin:** `D-01` in the reaudit-p2-sweep kit — [`decisions.md`](../../internal/initiatives/reaudit-p2-sweep/decisions.md)

---

## Context

`dompurify` was a production dependency that nothing imported (finding N8 of the 2026-10-04
readiness audit). Two rule files said every string reaching `dangerouslySetInnerHTML` goes through
it, and nothing in `src` used `dangerouslySetInnerHTML` either.

So the rule named a library that guarded nothing, and nothing checked the rule. The package still
cost something: a production dependency is audited on every pull request
([ADR-0023](./adr-0023-pull-requests-block-on-production-advisories-only.md)), and `dompurify` was
one of the three advisories that blocked every PR on 2026-10-01.

## Decision

- `dompurify` is removed from `dependencies`.
- `react/no-danger` is an error in `eslint.config.mjs`. Lint fails on any warning or error, so
  `dangerouslySetInnerHTML` cannot reach `dev`.
- An exception takes three things together: a disable comment with its reason, a sanitiser added
  back as a dependency, and a decision record.

## Options considered

- **Keep the dependency for the day it is needed.** An unused package is audited, updated and
  shipped in the lockfile for nothing, and its presence reads as "this app sanitises HTML".
- **Remove it and keep the written rule.** The rule would name a library that is not installed,
  enforced by nobody. A convention with no mechanism is how the `components` layer boundary went
  unenforced for months.
- **Remove it and write no rule.** The first `dangerouslySetInnerHTML` would arrive with no
  sanitiser and nothing to prompt one.

## Consequences

- One fewer production dependency to audit.
- Rendering a string as HTML is now a deliberate act with a visible cost. Rich text from the
  backend, if it is ever wanted, starts with a decision and not with a component.
- The rule reads JSX. It does not see `innerHTML` assigned through a ref, or a script element
  built by code, which the nonce policy also does not stop
  ([ADR-0026](./adr-0026-script-runs-by-nonce.md)). Those stay rules for a reviewer.
- `cypress/e2e/csp/public-pages.cy.ts` sets `innerHTML` on purpose, to prove the policy blocks
  injected markup. It is test code and is not affected.

## References

- [`../../internal/audits/saas-readiness/audit-2026-10-04.md`](../../internal/audits/saas-readiness/audit-2026-10-04.md) § 6, N8
- [`../../internal/initiatives/reaudit-p2-sweep/`](../../internal/initiatives/reaudit-p2-sweep/)
