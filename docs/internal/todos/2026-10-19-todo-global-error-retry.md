# 2026-10-19 - Todo: the global error page tries again with `retry`

**Context:** debt register row F-46, from kit `route-error-boundaries` (checklist § Discovered and
its D-01). D-01 moved every `error.tsx` to Next's `retry`, which fetches and renders again; `reset`
only clears the error and renders the same failed payload. `src/app/global-error.tsx` was left on
`reset`. It is what an error thrown by a route group's own `layout.tsx` reaches, so its "Try again"
could not recover a server error at all.

## Checklist

- [x] `src/app/global-error.tsx` takes `retry` and calls it from "Try again"; copy, markup and
      reporting unchanged.
- [x] `src/app/__tests__/route-error-boundaries.test.tsx`: a `global-error` block, outside the
      table since the page renders its own document: fixed copy and never the error's message;
      "Try again" calls `retry` once.
- [x] Seen to fail: with the button disconnected from `retry`, the second case fails; restored.
- [x] In a real browser, production build, a temporary route group whose own layout throws on its
      first render for each key, and a throwaway spec (both deleted):
  - with `reset`, the page did not recover in 3 of 3 runs;
  - with `retry`, it recovered in 3 of 3.
- [x] Found: the global error page renders in the browser's default serif and ignores the chosen
      theme. It replaces the root layout, which is what sets the `next/font` variables on `<html>`
      and where `next-themes` applies `data-theme`; measured `--font-quicksand` empty, `<html>`
      with no class and no `data-theme`, body font `Times`. Next's docs say as much
      (`error.md`, global-error "Good to know") → out of scope, register row F-64. Fixed in
      `2026-10-20-todo-global-error-theme-fonts.md`.
- [x] Register: F-46 closed, F-64 filed; README names the next ready row.
- [x] Gates

## Status

Done 2026-10-19 on `fix/global-error-retry`. Every error boundary in `src/app` now calls `retry`.
