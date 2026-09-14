# Dev-only correctness

**Purpose:** ticket C from the UI-refactor follow-ups — `/account` hanging under `next dev`, and the
theme key mismatch — plus two adjacent cleanups.
**Owner:** hardini
**Branch:** `fix/dev-only-correctness` off `dev`

## 1. `/account` never left "Loading…"

`withAuth` guarded its bootstrapper with a `startedRef`, which deadlocked against the cleanup it
shares an effect with:

1. first StrictMode pass runs, sets the ref, starts `bootstrap`
2. StrictMode's cleanup sets that pass's `cancelled = true`
3. second pass returns early on the ref, so nothing restarts
4. the in-flight `bootstrap` reaches `finally`, sees `cancelled`, skips `setChecking(false)`

Nothing ever cleared `checking`, so the spinner stayed up.

- [x] Removed `startedRef`. Each pass owns its own `cancelled`, so the surviving pass completes and
      the abandoned pass's late response is correctly ignored. Costs one extra profile fetch in
      development, which is what StrictMode exists to surface.
- [x] Added `withAuth.int.test.tsx` — the HOC had no tests at all.

**These tests do not reproduce the race, and that was established rather than assumed.** Three
attempts failed. Instrumenting the original showed jsdom orders it
`effect → finally → cleanup → effect`: the bootstrapper always settles _before_ the cleanup, even
with a promise held open across the remount, because jsdom schedules the cleanup after the
microtask queue drains. A browser runs it in the same commit, which is why `/account` hung in
`next dev` and not in the suite. The tests therefore pass against the broken component; they cover
the HOC's contract, not the deadlock. **Verification is the browser, not a green run.**

## 2. Theme key mismatch

`public/scripts/theme-init.js` reads `THEME_STORAGE_KEY` (`lakira.theme`) before paint, while
`providers.tsx` passed no `storageKey`, so next-themes used its default `theme`.

- [x] `ThemeProvider` now takes `storageKey={THEME_STORAGE_KEY}`. Fixed on the provider rather than
      the script: `constants/app.ts` documents the branded key as the app's, and
      `scripts/bootstrap-fork.sh` rewrites it.

**The bug was latent.** Nothing in the app calls `useTheme` or `setTheme` — there is no theme
switcher in the UI at all — so no stored theme was ever written and the script always fell through
to the system preference. The mismatch would have bitten the moment a toggle was added. Verified by
seeding `lakira.theme = "dark"` by hand and reloading: `data-theme="dark"` applied pre-paint,
`lakira.theme` the only key present, next-themes' `theme` key absent.

## 3. `src/utils/theme.ts` deleted

Unused — nothing imported it — and its `resetTheme` called `setTheme`, which re-wrote the key it had
just removed, so it never returned to following the system. next-themes owns theming; a second
hand-rolled implementation is the hazard.

- [x] Deleted. `src/utils` statement coverage rose 55.33 % → 70.04 % as a result.

## 4. `.claude/rules/testing.md` coverage claim

Said thresholds were placeholders (3/2/3/3 %) and that coverage "gates nothing". Both untrue since
2026-08-27.

- [x] Rewritten with the real numbers, verified rather than copied: `jest.config.ts` sets
      29/29/26/29; `coverage-goals.json` sets 80/65/50/30/15; `coverage:check` carries `--strict` in
      the npm script itself; `.github/workflows/test.yml:69` runs it.

## Verification

| Gate                      | Result                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `lint`                    | 0 errors, 19 warnings (`dev` baseline 21; deleting `theme.ts` cleared two) |
| `lint:css`                | clean                                                                      |
| `typecheck`               | clean                                                                      |
| `test:unit`               | 76 suites, 638 tests                                                       |
| `test:integration`        | 18 suites, 91 tests (was 17 / 87)                                          |
| `coverage:check --strict` | all goals met; `src/utils` 70.04 % (was 55.33 %)                           |

## Status

**Complete.** Code, automated gates, and the browser check.

`/account` was confirmed in `next dev` on 2026-09-15, once the backend port conflict was resolved:
it renders the profile on both a redirect from login and a hard direct load, with no
"Loading your account…" spinner. That was the only evidence available for this fix, since the suite
cannot stage the race.

## Follow-ups

- **There is no theme switcher.** The token system, the docs and `theme-init.js` all support light
  and dark, but nothing lets a user choose. Either the UI is missing or the theming is dead weight.
- `withAuth` is arguably redundant: `/account` is already gated by `src/proxy.ts` and by
  `(app)/layout.tsx`, and the page fetches the profile itself via `useAuthProfileQuery`. It is also
  one of the four files quarantined from the layer rule. Deleting it would shrink that list to three
  — worth considering, but a wider change than this ticket.
