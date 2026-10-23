# 2026-10-23 - Todo: three Next.js advisories need `next` 16.4.1

**Context:** found on `fix/category-chip-contrast` (register row F-56), when `npm run
security:audit` failed right before handover. Two advisories against `next` were published on
2026-10-22 at about 15:50 UTC, and a third at 16:42 UTC, which #143's own run found. `dev`'s own run for `5175e5b`, at 17:14 UTC, still passed its
audit step, so the advisory had not reached that run's audit. The next pull request's run will
fail on it.

| Advisory                                                                                         | Severity | Affects                 | Patched in |
| ------------------------------------------------------------------------------------------------ | -------- | ----------------------- | ---------- |
| GHSA-673q-mjm6-r5xr, remote code execution in `use cache` functions returning typed arrays       | critical | `next` 16.0.0 to 16.4.0 | 16.4.1     |
| GHSA-2464-fhr4-w9xw, remote code execution in the Image Optimization API when SVG files are used | critical | `next` 16.0.0 to 16.4.0 | 16.4.1     |
| GHSA-p3m5-59mp-jv5r, denial of service in the App Router through Server Actions                  | high     | `next` 16.0.0 to 16.4.0 | 16.4.1     |

The installed version is 16.3.8, with `package.json` declaring `^16.0.3`. 16.4.1 is published,
and 16.4.2 is `latest`.

What is known, checked on 2026-10-23:

- No source file imports `next/image`, and `next.config.ts` sets no `images` options. `/_next/image` is excluded from `src/proxy.ts`'s matcher, so it is served without the session check, as Next serves it by default.
  _Inference:_ whether the optimizer can be reached with an SVG on this deployment is not
  established, and the fix does not depend on it.
- CI's `Security Scan` job runs `npm audit --omit=dev --audit-level=high` (`.github/workflows/test.yml`,
  ADR-0023), so the gate fails on any of them, and "CI passed" holds every pull request into
  `dev` until the bump lands (ADR-0039).

## Checklist

- [x] Move `next` to 16.4.1 or later (and `eslint-config-next` with it, if it is pinned to the
      same version), in its own pull request; `npm run security:audit` reports 0
- [x] Read the 16.4.x release notes for anything this repo relies on (the proxy, `retry` in error
      boundaries, caching) before merging; run the full gate list, the stack suites included

## Status

Fixed 2026-10-23 in #144, on `fix/next-16-4-advisories`. `npm update next` moved the `next`
family, `next`, `@next/env` and the eight `@next/swc-*` builds, from 16.3.8 to 16.4.2, inside the
`^16.0.3` range; `package.json` is unchanged and the production audit reports 0. `npm audit fix`
was not used: it rewrote about 1,400 lockfile lines across development dependencies.
`eslint-config-next` stays at 16.0.3, a development dependency the gate does not audit.

No source file uses `use cache` or imports `next/image`. Nothing in the 16.4.0 notes or the
bundled upgrade guide applies to this repo's configuration; every gate passed on 16.4.2, the four
e2e suites included.

As first filed, this todo named CI's `checks` job as the one that runs the audit; it is the
`Security Scan` job (`.github/workflows/test.yml`). Corrected above, with the third advisory.
