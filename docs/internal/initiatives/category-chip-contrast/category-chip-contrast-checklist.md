# Category chip contrast — Checklist

Register row F-56. The chip's text was 4.11:1 in the dark metrics table; the owner chose an
opaque tint on a fixed base ([D-01](decisions.md), promoted to ADR-0040).

## Change

- [x] `src/styles/tokens/semantic.css`: `--tint-base`, `--gray-white` in light and `--gray-900` in
      dark, with the worst cases in comments
- [x] `src/styles/tokens/components/category-color.recipe.css`: `.category-color-bg` mixes 20 % of
      `--category-color` into `--tint-base`, opaque
- [x] `src/features/metric-categories/components/CategoryChip.tsx`: passes the colour as picked,
      text is `text-ink` always, `toTintedBg` and the `pickTextColor` call removed; a colour that
      is not a hex value gets the fallback styling
- [x] `cypress/e2e/stack/app-pages-with-data.a11y.cy.ts`: `isKnownFailure` removed, so the dark
      metrics table is checked at 1000 and 1280 px

## Tests

- [x] `src/styles/__tests__/category-chip-contrast.test.ts`: the worst case over a 5,832-colour
      grid is 4.5:1 or more in both themes, from the token files. Failed before the change
      (`--tint-base` undefined); with the dark base set to gray-700 it fails at 3.70:1
- [x] `CategoryChip.test.tsx`: the colour reaches the recipe as picked, and a non-hex colour gets
      the fallback. Both failed before the change. The `text-ink` cases for four colours passed
      before it too, since the old picker composited over white and so always chose `text-ink`;
      they stay as guards

## Docs

- [x] ADR-0040 and its registry row; D-01 carries the promotion banner
- [x] `.claude/rules/styling.md`: a user colour is tinted in its recipe over `--tint-base`
- [x] Register: F-56 closed with #143, O-12 removed, "As of" moved to `5175e5b`; the register
      README's status line
- [x] `2026-10-17-todo-axe-pages-with-data.md`: its Found line names the decision

## Discovered

- [x] Found: two `next` advisories published 2026-10-22, one critical, patched in 16.4.1;
      `security:audit` fails → out of scope, filed as
      `docs/internal/todos/2026-10-23-todo-next-16-4-1-advisories.md`, register row F-74

## Acceptance

- [x] The dark metrics table at 1000 and 1280 px passes axe `color-contrast` with the chip on it.
      _Why:_ F-56, WCAG 1.4.3. · **a machine checked it**: e2e (stack), no exclusion, both cases
      pass
- [x] For every colour on the grid the chip's text is at least 4.5:1 in both themes. _Why:_ the
      colour is user data. · **a machine checked it**: `category-chip-contrast.test.ts`
- [x] Light chips are unchanged in practice. _Why:_ only dark failed. · **computed, not seen**: at
      most 11 of 255 per channel lighter (D-01)
- [x] F-56 closed and O-12 removed. _Why:_ the register is what "what's next" reads. ·
      `register-todos` passes in the unit gate

## Gates

Run 2026-10-23 on Node 24.21.0.

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] integration
- [x] spec drift
- [x] build
- [x] e2e (stack), 71 of 71, and e2e (csp, stack), 8 of 8, against `next start` of this build,
      with `E2E_ALLOW_STALE_BACKEND=1`: the local backend image is `00fb2d2`, four commits behind
      backend `dev` (#207 to #210)
- [ ] `security:audit`: **fails**, on the two `next` advisories (F-74), not on this change
- [ ] e2e and e2e (csp): skipped, the chip is on no public page
