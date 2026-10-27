# zod 4 upgrade — Decisions

## D-01 — zod 4's API, with `@hookform/resolvers` 5.9.2

- **Status:** Accepted
- **Date:** 2026-10-24

> **Promoted to [ADR-0043](../../../explanation/decisions/adr-0043-the-frontend-moves-to-zod-4.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

**Context.** GHSA-mrhx-c7xc-m3w5 covers every zod release before 4.6.6, and no zod 3 release
fixes it. `@hookform/resolvers` 4.1.3 has no zod 4 support.

**Decision.** The owner chose zod 4's API on 2026-10-24: `zod` ^4.6.7, imported from `"zod"`.
`@hookform/resolvers` ^5.9.2, which accepts `zod ^3.25 || ^4` and needs `react-hook-form ^7.55`
(7.66.0 is installed). Removed APIs are replaced where used; deprecated ones that still work stay.

**Options considered.** zod 4 with every import moved to `"zod/v3"`: rejected by the owner, the
migration only postponed. `@hookform/resolvers` 6.0.0: published 2026-10-19, too new to take.

**Consequences.** Five forms are typed with their schema's input and output types, since a
defaulted field is optional on input. `required_error` became an `error` function,
`whenMissing`. `npm install` re-hoisted `ajv`: the top-level copy is now 8.20.0, and `eslint` and
`@eslint/eslintrc` get their own 6.15.0; both versions were already in the lockfile.

## D-02 — The log value field carries its own messages

- **Status:** Accepted
- **Date:** 2026-10-24

**Context.** The log form shows `errors.logValue.message`, and `logFormSchema`'s `logValue` had no
message of its own, so users read zod's wording. zod 4 changed it from "Number must be greater
than or equal to 0" to "Too small: expected number to be >=0", and an empty input (NaN through
`valueAsNumber`) from "Expected number, received nan" to "Invalid input: expected number,
received NaN". The other forms' shown fields already use `ZodMessages`.

**Decision.** `logValue` is `z.number({ error: logValueRequired }).nonnegative({ message:
logValueNegative })`. `logValueNegative` is new: "Log value cannot be negative"; the empty case
reuses "Log value is required".

**Options considered.** Keeping zod's new wording: rejected, it reads as a developer message.
Reusing `logValueNonNegative` ("must be a positive number"): rejected, zero is allowed.

**Consequences.** `src/features/metric-logs/__tests__/log-form-schema.test.ts` pins both
messages; it failed on zod 4 before the change.

## D-03 — zod runs without its eval fast path in the browser

- **Status:** Accepted
- **Date:** 2026-10-24

**Context.** With zod 4 installed, `npm run test:e2e:csp` failed 2 of 7 and
`npm run test:e2e:csp:stack` 7 of 8: every page reported `{"directive":"script-src","blocked":"eval"}`.
zod 4 compiles a fast parser for object schemas with `new Function`, and finds out whether it may
by trying (`util.allowsEval`); the Content Security Policy forbids eval (ADR-0026) and reports the
attempt. zod reads its `jitless` switch when a schema is built (`const jit =
!core.globalConfig.jitless` in `v4/core/schemas.js`), and skips the probe when it is set. The
other two e2e suites passed; jsdom and the unit suites have no CSP and could not see it.

**Decision.** `src/instrumentation-client.ts` calls `z.config({ jitless: true })`. Next runs that
file in the browser before the application's own code, so it is set before any schema module is
evaluated; the setting lives on `globalThis.__zod_globalConfig`, shared by every copy of zod. The
server is untouched: route handlers run in Node, where no CSP applies.

**Options considered.** Adding `'unsafe-eval'` to `script-src`: rejected, `.claude/rules/security.md`
forbids it and it would let any injected string run. A wrapper module that configures zod and is
imported instead of `"zod"`: rejected, 19 import sites and a lint rule to keep them, for the same
effect as one call made first. Leaving the violation: rejected, the reports reach
`/api/security/csp-report` on every page and the two CSP suites fail.

**Consequences.** Object parsing in the browser takes zod's ordinary path, which is what zod 3 did.
`src/__tests__/instrumentation-client.test.ts` pins the switch, and failed before it; the two CSP
suites are the proof in a browser, 7 of 7 and 8 of 8 after it.
