# zod 4 upgrade — Plan

- **Status:** Done
- **Appetite:** 1 day — past that, cut scope rather than extend
- **Date:** 2026-10-24

## Context and goals

GHSA-mrhx-c7xc-m3w5 (high) was widened on 2026-10-23 to every `zod` release before 4.6.6, so the
production audit, and with it CI's Security Scan and every merge into `dev`, failed on zod
3.25.76 ([todo](../../todos/2026-10-24-todo-zod-advisory.md), register row F-78). No zod 3 release
fixes it. The goal is a clean audit on zod 4's API with every form behaving as before.

## Acceptance criteria

- **AC-1** — `npm run security:audit` reports 0 vulnerabilities. _Why:_ the gate every pull
  request into `dev` needs (ADR-0023, ADR-0039).
- **AC-2** — The zod atoms in `src/constants/zod-rules.ts` keep their defaults and their
  `ZodMessages` messages. _Why:_ those messages are the copy users read.
- **AC-3** — Every form suite passes unchanged on zod 4. _Why:_ `zodResolver` sits under all of
  them.
- **AC-4** — The log form's value field shows the repository's own messages for a negative and
  an empty value. _Why:_ it was the one shown field that used zod's wording, which zod 4 changed.
- **AC-5** — Only `zod` and `@hookform/resolvers` change version in the lockfile. _Why:_ an
  upgrade that drags other packages along is a second change hiding in the first.

## Open questions

None open. The owner chose zod 4's API over a `zod/v3` import shim, and a Notion Part 1 record
for the backend after the merge (2026-10-24).

## Out of scope

- Moving the deprecated method forms (`.uuid()`, `.email()`, `.datetime()`, `{ message }`) to
  zod 4's top-level ones: they still work, and lint accepts them.
- The backend's own upgrade.

## Decisions expected

- D-01: zod 4's API, and which `@hookform/resolvers` line.
- D-02: what replaces zod's wording where users see it.
- D-03, not foreseen: zod 4's eval probe under the Content Security Policy, found by the CSP
  e2e suites.

## Phases

### Phase 0 — pin, bump, fix

Pin the atoms' behaviour on zod 3; install zod ^4.6.7 and resolvers ^5.9.2 with `npm install`,
not `npm audit fix`; fix the type errors and messages; run every gate.

## Risks and trade-offs

zod 4's `.uuid()` checks RFC 9562 variant and version bits, where zod 3 checked the shape only.
Every fixture id and the backend's `gen_random_uuid()` ids pass; a hand-made id like
`11111111-1111-1111-1111-111111111111` would not.

## Security and data

The change replaces a dependency on the input-validation path. Server-side, two observability
routes (`src/app/api/observability/*`) validate untrusted bodies with zod; neither uses an array.

## References

[ADR-0043](../../../explanation/decisions/adr-0043-the-frontend-moves-to-zod-4.md) ·
GHSA-mrhx-c7xc-m3w5 · F-74's todo, the same kind of fix for `next`
