# ADR-0043 — The frontend moves to zod 4

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related:** supersedes the "pinned at v3" line of `.claude/rules/forms-and-validation.md`;
  the same production audit gate as ADR-0023
- **Origin:** kit `zod-4-upgrade`, D-01 — [`decisions.md`](../../internal/initiatives/zod-4-upgrade/decisions.md); debt register row F-78

---

## Context

GitHub widened advisory GHSA-mrhx-c7xc-m3w5 (high) at 18:26Z on 2026-10-23 to every `zod`
release before 4.6.6. The flaw is in zod 4's array parser, `$ZodArray`, which collects an issue
for every failing element with no cap, so a large array exhausts memory. zod 3.25.76, which this
repository ran, is in range because it ships zod 4's code under `zod/v4`.

The frontend imported zod 3's API from `"zod"` and no schema in `src/` validates an array, so the
flaw was most likely not reachable (an inference from the advisory's text). But CI's Security Scan
runs `npm audit --omit=dev --audit-level=high` (ADR-0023), which fails on it, and "CI passed"
then holds every pull request into `dev` (ADR-0039). No zod 3 release carries a fix.

## Decision

The owner chose on 2026-10-24 to move to zod 4's API.

1. **`zod` ^4.6.7** (published 2026-10-12), imported from `"zod"` as before.
   **`@hookform/resolvers` ^5.9.2**, the line that supports zod 4; 6.0.0, published 2026-10-19,
   was too new to take.
2. **Schemas keep their shape.** Method forms zod 4 still accepts (`.uuid()`, `.email()`,
   `.datetime()`, `{ message }`) stay. What zod 4 removed is replaced: `required_error` by an
   `error` function, and the five forms whose schemas use `.default()` are typed with the
   schema's input and output types.
3. **A message users read is the repository's own.** The one form field that showed zod's
   wording, the log value, gets `ZodMessages` entries (kit D-02).
4. **zod runs without its eval fast path in the browser.** zod 4 probes `new Function` to compile
   object parsers, which the Content Security Policy reports as an eval violation on every page
   (ADR-0026). `src/instrumentation-client.ts` calls `z.config({ jitless: true })` before the
   application's code runs (kit D-03). The policy is not widened.

## Options considered

- **zod 4 installed, every import moved to `"zod/v3"`:** rejected by the owner. It clears the
  audit with the smallest diff, but leaves the code on a deprecated path, so the migration is
  only postponed.
- **Waiting for a zod 3 release:** none is planned for this advisory, and the gate blocks merges
  meanwhile.
- **Excluding the advisory from the audit:** `npm audit` has no per-advisory exclusion, and a
  workflow change to add one would weaken the gate for a dependency that can be upgraded.

## Consequences

- zod's own error wording changed; any field whose message reaches users must carry a
  `ZodMessages` entry. `src/constants/__tests__/zod-rules.test.ts` pins the atoms' messages and
  defaults, and passed unchanged on both versions.
- lakira-backend is on zod 3.25.67, so the two repositories' validation code no longer shares
  syntax. The backend is told on the Notion page (Part 1), since its request schemas are where
  `z.array()` would meet untrusted input.
- Only the CSP e2e suites can see a library that reaches for eval; jsdom has no policy. They
  found this one, and are the check for the next.
- `eslint-plugin-react-hooks` resolves to the same zod 4.6.7, which its range allows.
