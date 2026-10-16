# 2026-10-16 - Todo: drop the unused Google Fonts hosts from the CSP

**Context:** debt register row F-54, found while doing F-21
(`2026-10-14-todo-inline-style-stays.md` § Discovered). Both policies allowed
`https://fonts.googleapis.com` in `style-src` and `https://fonts.gstatic.com` in `font-src`
(`src/lib/csp.ts`, repeated in `next.config.ts`). The fonts come from `next/font/google`
(`src/app/layout.tsx:4`), which self-hosts them. The decision is
[ADR-0031](../../explanation/decisions/adr-0031-fonts-are-self-hosted.md).

## Checklist

- [x] Show the browser never asks either host for anything (evidence below)
- [x] `csp.ts` and `next.config.ts`: `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`
- [x] `csp.test.ts`: the exact lists and the ADR-0030 allowlist drop both hosts; seen to fail with
      `https://fonts.gstatic.com` put back in `font-src`, then restored
- [x] ADR-0031, its registry row, and ADR-0030's `Related` line pointing at it
- [x] Gates, including both CSP browser suites
- [x] Register: F-54 closed

## Evidence

Read on frontend `dev` at `2c97769`, Node 24.21.0, production build.

- Before the change: the compiled stylesheet's `@font-face` rules load `../media/*.woff2` only, and
  nothing under `.next/static` names either host. The one server chunk that did was the policy
  string.
- Nothing in `src/` or `public/` adds a `<link>` to Google Fonts or an `@import` of it.
- After the change, on `npm run start`:
  - `/login` is served `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:`.
  - Each of the seven `.woff2` files its stylesheet names returns 200 from `/_next/static/media/`.
  - Neither host appears anywhere in the build output, source maps aside.
- In a browser with the policy enforced, a one-off probe on `/login` (deleted after the run)
  showed:
  - `document.fonts` held Quicksand (three faces) and Plus Jakarta Sans (two faces), all
    `loaded`.
  - The body's computed `font-family` starts with Quicksand, as does the heading's.
  - No `securitypolicyviolation` fired.
- `e2e (csp)` 7 of 7 and `e2e (csp, stack)` 7 of 7 pass; each fails on any violation.

## Status

Done on `fix/csp-drop-font-hosts`, 2026-10-16.

- Gates: lint, css lint, typecheck, format, unit (with `coverage:check`), build, spec drift,
  `e2e (csp)`, `e2e (csp, stack)` and `e2e (stack)` (29 of 29) pass. Integration and the public
  `e2e` were not run: no data access, routing or page changed, and `e2e (csp)` loads the public
  pages with the policy enforced.
- Not tested: what `next/font` does when the build cannot reach Google. That happens on the build
  machine, where no browser policy applies.
