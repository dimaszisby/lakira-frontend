# 2026-10-24 - Todo: the zod advisory needs zod 4

**Context:** found on `chore/tracker-as-code`, when `npm run security:audit` failed right before
handover. GitHub widened GHSA-mrhx-c7xc-m3w5 at 18:26 UTC on 2026-10-23. `dev`'s own run for
`7d72c79`, at 17:43 UTC, still passed its audit step; the next run will fail on it.

| Advisory                                                                                     | Severity | Affects       | Patched in |
| -------------------------------------------------------------------------------------------- | -------- | ------------- | ---------- |
| GHSA-mrhx-c7xc-m3w5, memory exhaustion when validating an oversized array with failing items | high     | `zod` < 4.6.6 | 4.6.6      |

The installed version is 3.25.76, with `package.json` declaring `^3.24.2`. No zod 3 release
carries a fix.

What is known, checked on 2026-10-24:

- The flaw is in zod 4's `$ZodArray`. zod 3.25.76 is in range because it ships zod 4's code under
  `zod/v4`; this repository imports zod 3's API from `"zod"`, and no schema in `src/` uses
  `z.array()`. _Inference:_ the flaw was not reachable here; the fix does not depend on it.
- CI's `Security Scan` job runs `npm audit --omit=dev --audit-level=high`
  (`.github/workflows/test.yml`, ADR-0023), and "CI passed" holds every pull request into `dev`
  until the upgrade lands (ADR-0039).

## Checklist

- [x] Move to zod 4.6.6 or later, and `@hookform/resolvers` to a line that supports it, in its own
      pull request; `npm run security:audit` reports 0
- [x] Pin the zod atoms' messages and defaults before the move, and keep them passing after it

## Status

Fixed 2026-10-24 in #152, on `fix/zod-4-upgrade` (kit `zod-4-upgrade`, ADR-0043). zod 4.6.7 and
`@hookform/resolvers` 5.9.2; the production audit reports 0. Register row F-78. lakira-backend, on zod
3.25.67, is told by a Notion Part 1 record after the merge, a handover step rather than a box
here.
