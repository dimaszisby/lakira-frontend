# 2026-10-20 - Todo: the global error page uses the app's fonts and theme

**Context:** debt register row F-64, found while closing F-46
(`docs/internal/todos/2026-10-19-todo-global-error-retry.md`). `src/app/global-error.tsx` replaces
the root layout, which is what puts the `next/font` variables on `<html>` and where next-themes sets
`data-theme`. Measured in #118: `--font-quicksand` empty, `<html>` with no class and no
`data-theme`, body font `Times`. No stylesheet has a `prefers-color-scheme` rule, so with no
attribute the page was light for everyone. Next's docs say global-error brings its own global
styles, fonts and theme (`error.md`, global-error "Good to know").

## Decision

- **Fonts:** the two `next/font` calls move from `src/app/layout.tsx` to `src/app/fonts.ts`, which
  both documents import. A second set of calls in global-error would host each font twice (Next's
  "font definitions file", `font.md`). The file is in `src/app`, not `src/styles`, because both
  users are there and `src/styles` is not a `boundaries` element.
- **Theme:** an effect in global-error reads the stored choice the way next-themes' pre-paint
  script does (`THEME_STORAGE_KEY`; `system` or nothing resolved from the OS, as
  `defaultTheme="system"` in `src/app/providers.tsx`) and sets `data-theme` and `color-scheme`.

Rejected:

- **next-themes' `ThemeProvider` around the page.** It renders an inline script that needs the CSP
  nonce, and a client component cannot read it from the request headers (ADR-0026). Without the
  nonce the script is a violation, and making it work would mean a CSP change.

The cost: someone who chose dark sees one light paint before hydration on this page, the same kind
of frame as F-39 on a normal cold load, on a page that is rarely seen. No inline script, no CSP or
`src/proxy.ts` change, no props or dependency change, so the ephemeral size held.

## Checklist

- [x] `src/app/fonts.ts`: `quicksand` and `plusJakartaSans`, options unchanged;
      `src/app/layout.tsx` imports them.
- [x] `src/app/global-error.tsx`: imports `@/styles/globals.css`, puts both font variables on its
      `<html>`, and applies the stored theme in an effect.
- [x] `jest.config.ts`: the CSS mapper moved first. The `@/styles/*` alias matched before it, so
      importing `@/styles/globals.css` handed Jest the real stylesheet.
- [x] `src/app/__tests__/route-error-boundaries.test.tsx`: four theme cases in the `global-error`
      block (stored dark with a light OS, stored light with a dark OS, `system`, nothing stored),
      with `src/app/fonts` mocked since `next/font` does not run under ts-jest.
- [x] Seen to fail: with the effect not setting `data-theme`, all four cases fail; restored.
- [x] In a real browser, production build, CSP enforced (`E2E_ENFORCE_CSP=1`), a temporary route
      group whose own layout throws, and a throwaway spec (both deleted). Each case compared the
      error page with `/login` in the same theme: stored light with a dark OS, stored dark with a
      light OS, `system` with a dark OS, nothing stored with a light OS.
  - before: all four failed, `<html>` had no `data-theme`;
  - after: all four passed. `data-theme`, the body's `font-family` (Quicksand), background and
    text colour matched `/login`, `--font-quicksand` was set, and no CSP violation was reported.
- [x] Register: F-64 closed; README says no row is ready. The F-46 todo's "Found" box ticked.
- [x] Gates

## Status

Done 2026-10-20 on `fix/global-error-theme-fonts`. The register has no `ready` row left; every
open row waits on the owner, the backend or a package's maintainers.
