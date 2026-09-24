# Two pre-paint theme scripts are shipped, not one

**Purpose:** establish whether `public/scripts/theme-init.js` is still needed now that
`next-themes` injects its own pre-paint script.
**Owner:** hardini
**Branch:** `fix/two-pre-paint-theme-scripts` off `dev`
**Found:** while verifying no-flash behaviour under `feat/theme-switching`.

## What was observed

`curl http://localhost:3000/login` returns **both** of these in one document:

1. In `<head>`, the repo's own script, queued through `<Script strategy="beforeInteractive">` in
   `src/app/ThemeScript.tsx`:

   ```html
   <link rel="preload" href="/scripts/theme-init.js" as="script" />
   <script>
     (self.__next_s = self.__next_s || []).push(["/scripts/theme-init.js", { id: "theme-script" }]);
   </script>
   ```

2. As the **first node inside `<body>`**, an inline script `next-themes` injects itself:

   ```js
   ((e, i, s, u, m, a, l, h) => { … })("data-theme", "lakira.theme", "system", null, ["light", "dark"], null, true, true)
   ```

Both read `lakira.theme`, both fall back to `prefers-color-scheme`, and both set `data-theme` on
`<html>`. The work is being done twice.

## Why it is worth a look

- The `next-themes` script is inline and first in `<body>`, so it genuinely runs before paint. The
  repo's own goes through `__next_s`, which is Next's script queue — whether that still beats first
  paint in Next 16 App Router is the actual question, and it is not obvious from the markup.
- If `next-themes` is doing the job, `ThemeScript.tsx`, `public/scripts/theme-init.js`, the
  duplicated `THEME_STORAGE_KEY` literal, and the `scripts/bootstrap-fork.sh` sync burden that
  `src/constants/app.ts` documents at length could all go.
- If it is **not** doing the job, then the comment in `src/constants/app.ts` is right and the
  `next-themes` copy is the redundant one — but nothing currently says which.

Do not delete either on reasoning alone. The failure mode is a flash of the wrong theme on first
paint, which is exactly the bug the `storageKey` comment in `src/app/providers.tsx` records, and it
is invisible in tests.

## The check

- [x] Throttle CPU, hard-reload with a stored theme that differs from the OS setting, and record
      whether removing each script produces a flash. Only `theme-init.js` can be removed —
      `ThemeProvider` always injects its script and has no option to stop — so the real question
      was whether next-themes alone is enough. Method and numbers below.
- [x] Decide which one stays; delete the other and its supporting machinery. **`theme-init.js`
      goes.**
- [x] If `theme-init.js` goes, update `src/constants/app.ts`'s module comment and
      `scripts/bootstrap-fork.sh`. The fork script needs **no** change: it rewrites `<short>.theme`
      across every tracked file generically, and the literal in `src/constants/app.ts` still needs
      it.

## The measurement (2026-09-24)

Production builds (`next build` + `next start`) of `dev` at `f794304`, driven by headless Chrome
over the DevTools protocol with the CPU throttled 6x. A script registered with
`Page.addScriptToEvaluateOnNewDocument` runs before any page script: it seeds `lakira.theme`, then
records every write to `data-theme` and the `first-paint` / `first-contentful-paint` entries. A
load counts as a flash if the attribute at first paint differs from the expected theme, or if it
ever changes to a different value afterwards. Four cases, five loads each, per Chrome instance:
stored `dark` / OS light, stored `light` / OS dark, stored `system` / OS dark, nothing stored / OS
dark. Every instance starts with an empty cache.

| Build                                | Loads | Flashes |
| ------------------------------------ | ----- | ------- |
| A — both scripts (`dev` as is)       | 120   | 1       |
| B — `<ThemeScript />` removed        | 100   | 1       |
| C — this branch, as built for review | 60    | 3       |

C and B are the same at runtime (C adds only comments and an ESLint change), so C's three looked
like it might be real. Every flash in every build was the first or second load of a fresh Chrome —
a cold cache — with stored `dark` and OS light. Those are only one or two loads per probe, so the
table above barely samples them. A controlled rerun isolated exactly that case: A and C served
side by side, alternating, 30 fresh Chrome instances each, one cold load per instance.

| Build                    | Cold loads | Flashes |
| ------------------------ | ---------- | ------- |
| A — both scripts         | 30         | 1       |
| C — `theme-init.js` gone | 30         | 1       |

No difference. In A's flash, next-themes wrote `dark` at 231 ms, 3 ms after first paint at 228 ms,
and `theme-init.js` wrote at 455 ms — far too late to have covered it.

**Which script does the pre-paint work.** In A every load wrote `data-theme` three times: about
60 ms, about 130–160 ms, and after hydration. In B the middle write disappears, so it was
`theme-init.js` — and it frequently landed _after_ first paint (first paint 120 ms, write 124 ms).
Going through Next's `__next_s` queue, it runs when Next's runtime gets to it, not before paint.
In all 20 of A's first-probe loads, next-themes' inline script had already set the right value
before `theme-init.js` ran, so `theme-init.js` could never have prevented a flash that next-themes
missed.

**The one flash in each build is the same event**: a non-contentful paint a few milliseconds
before _any_ theme script had run (A: first paint 124 ms, first write 132 ms; B: 208 ms and
211 ms). It happened with `theme-init.js` present, so keeping it does not prevent it. Closing it
would mean a blocking script in `<head>` rather than next-themes' first-in-`<body>` placement —
filed below as residual, not fixed here.

## Decision

**Keep next-themes' script; delete `src/app/ThemeScript.tsx` and `public/scripts/theme-init.js`.**

- Rejected: keeping both. The measurement shows the second script adds no pre-paint coverage, and
  it is the reason `THEME_STORAGE_KEY` has to be mirrored as a literal outside the module system.
- Rejected: keeping `theme-init.js` instead. Not available — `ThemeProvider` injects its script
  unconditionally.
- The storage key's _value_ still matters: users already have `lakira.theme` stored, and changing
  it would silently reset their choice. That is the reason to keep asserting it, not a mirror.
- **CSP coupling.** next-themes' script is inline. Production CSP allows it through
  `script-src 'self' 'unsafe-inline'` in `next.config.ts`. Tightening CSP to nonces later means
  passing the nonce to `ThemeProvider`'s `nonce` prop — next-themes 0.4 supports it, and Next's
  own inline scripts need the same treatment, so this adds no new obstacle.

## Discovered

- [x] Found: `eslint.config.mjs` ignored `public/scripts/**`, a directory that no longer exists
      → in scope, removed. A dead ignore would silently exempt whatever lands there next.
- [x] Found: the cold-load paint before any theme script (about 1 in 30 cold loads, stored theme
      opposite the OS) → out of scope, present with or without `theme-init.js`, filed as
      `docs/internal/todos/2026-09-24-todo-cold-load-paint-before-theme-script.md`.

## Verification

| Gate                                 | Result                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `lint`                               | 0 errors, 0 warnings                                                                                            |
| `lint:css`                           | clean                                                                                                           |
| `typecheck`                          | clean                                                                                                           |
| `format`                             | clean                                                                                                           |
| `test:unit`                          | 80 suites, 669 tests                                                                                            |
| `test:integration`                   | 19 suites, 99 tests — run because `layout.tsx` changed                                                          |
| `api:spec:check` / `api:types:check` | skipped — not triggered                                                                                         |
| `build`                              | passes — in a scratch worktree with this branch's diff, because a `next-server` from this checkout held `.next` |
| `test:e2e`                           | skipped — no flow changed end to end                                                                            |
| pre-paint probe                      | tables above                                                                                                    |

## Status

**Complete.** `src/app/ThemeScript.tsx` and `public/scripts/theme-init.js` are deleted; next-themes'
inline script is the only pre-paint theme script. Comments that described the mirror are rewritten
around the reason the key still matters — stored user choices — in `src/constants/app.ts`,
`src/app/providers.tsx`, `src/components/ui/ThemeSwitcher.tsx` and
`src/app/__tests__/theme-switching.int.test.tsx`; `docs/reference/design-tokens.md` and
`.claude/rules/styling.md` no longer name `ThemeScript.tsx`.

**Not promoted to an ADR.** It removes a redundant script and changes no interface, data shape,
dependency or security boundary; CSP is unchanged.
