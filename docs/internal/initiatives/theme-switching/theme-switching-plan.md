# Theme switching — Plan

- **Status:** Approved
- **Appetite:** 2 days — past that, cut scope rather than extend
- **Date:** 2026-09-20

## Context and goals

Two follow-ups from the `src/components/ui` overhaul, taken together because they are the same
surface: shipping a deliberate light-mode choice is what makes the light-mode contrast deviations
something a user can reach on purpose.

**No theme switcher exists.** `next-themes` is wired (`src/app/providers.tsx`), the pre-paint script
runs (`public/scripts/theme-init.js`), `src/styles/tokens/semantic.css` defines both themes — but
nothing in `src/` calls `useTheme` or `setTheme`. A user's theme is decided entirely by
`prefers-color-scheme` and cannot be overridden. Light mode is therefore **already live** for anyone
on a light OS; only the choice is missing.

**Button colour tokens violate two WCAG criteria, and that is being accepted, not fixed.**
`.claude/rules/styling.md` treats Button colour tokens as fixed brand identity. Every pairing was
recomputed from `palette.css`, `semantic.css` and `button.tokens.css`; the one-line note at
`.claude/rules/styling.md` § Known token-system defects understates the problem three ways.

**WCAG 1.4.3 Contrast (Minimum)** — label against button fill, needs 4.5:1:

| Theme | Variant     | State        | Ratio       |
| ----- | ----------- | ------------ | ----------- |
| light | primary     | rest / hover | 1.95 / 3.12 |
| light | secondary   | rest / hover | 1.95 / 1.61 |
| light | destructive | rest         | 3.16        |
| light | tertiary    | rest / hover | 2.64 / 4.39 |
| light | primary     | disabled     | 3.64        |
| dark  | destructive | rest         | 3.16        |
| dark  | primary     | hover        | 4.47        |
| dark  | tertiary    | hover        | 3.18        |

**WCAG 1.4.11 Non-text Contrast** — button boundary against the surface behind it, needs 3:1. Not
previously recorded at all, and it is what gives the _secondary_ (outline) button its only
affordance, since `--button-secondary-bg` is `--gray-white`:

| Surface                     | primary | destructive | tertiary | secondary border |
| --------------------------- | ------- | ----------- | -------- | ---------------- |
| light `--bg` #ebebeb        | 1.64    | 2.65        | 2.21     | 1.64             |
| light `--surface` #f8f9fa   | 1.85    | 3.00        | 2.50     | 1.85             |
| light `--surface-2` #f2f2f2 | 1.74    | 2.82        | 2.36     | 1.74             |
| dark `--bg` #2c2c2c         | 7.15 ✓  | 4.42 ✓      | 5.29 ✓   | 7.15 ✓           |
| dark `--surface` #4a4a4a    | 4.54 ✓  | 2.80        | 3.36 ✓   | 4.54 ✓           |

Three corrections to the existing record:

1. **Not light-mode-only.** `--button-destructive-fg` is never overridden under
   `:root[data-theme="dark"]`, so destructive fails 1.4.3 in dark too, as do two dark hover states.
2. **Repointing to the next ramp step does not reach AA.** Each hue has three steps (100/500/700);
   `matchagreen-700` under white text is 3.12, `softlavender-700` is 4.39.
3. **No single-axis fix exists.** Darkening the foreground fixes rest states (primary 1.95 → 7.15
   with `--gray-900`, which is what dark mode already does) but breaks hover, because hover is the
   _darker_ step — rest and hover want opposite foregrounds. Darkening the fill enough for white
   text needs relative luminance ≤ 0.183; the brand hues sit at 0.28–0.49, so every one goes
   near-black. Both criteria fail in light mode for the same underlying reason: the ramps are
   pastel and have only three steps.

**What changes when this lands:** users choose their theme from `/account`, and the deviations
become a numbered, dated record with measured options instead of a note that is wrong about its own
scope.

## Acceptance criteria

Each is singular and split by state, because "the toggle works" hides a theme × state matrix.

- **AC-1** — `/account` shows an Appearance card offering System / Light / Dark with the active
  theme preselected.
  _Why:_ theme is currently decided only by `prefers-color-scheme`; no override exists, and that
  gap is what this work closes.
- **AC-2** — Choosing a theme sets `data-theme` on the `<html>` element.
  _Why:_ `darkMode` in `tailwind.config.mjs` is `["class", '[data-theme="dark"]']`; a bare `.dark`
  class does nothing, per `.claude/rules/styling.md` § Hard rules.
- **AC-3** — Choosing a theme persists to `localStorage` under `lakira.theme`.
  _Why:_ the `storageKey` wiring in `providers.tsx` drifted once already — its own comment records
  that the pre-paint script and the provider read different keys, so a stored choice was never found.
- **AC-4** — A hard reload restores the chosen theme with no flash of the other one.
  _Why:_ that flash is the entire reason `public/scripts/theme-init.js` is a blocking pre-paint
  script rather than an effect.
- **AC-5** — Tab reaches the group, and arrow keys both move focus and change the selection.
  _Why:_ WCAG 2.1.1 Keyboard. `.claude/rules/accessibility.md` records that Ariakit only selects on
  arrow-key focus when the radio is a real `<input type="radio">`, which is the trap here.
- **AC-6** — Each segment's visible label is contained in its accessible name.
  _Why:_ WCAG 2.5.3 Label in Name.
- **AC-7** — Each segment's pointer target is at least 24×24 CSS px.
  _Why:_ WCAG 2.5.8 Target Size (Minimum); `--target-min` exists in `scales.css` for this.
- **AC-8** — The control renders disabled with no selection until mounted, with no hydration
  mismatch.
  _Why:_ `useTheme()` returns `undefined` on the server and on first client render. Returning `null`
  instead would shift the card's height on hydration, against the CLS budget in
  `.claude/rules/performance.md`.
- **AC-9** — ADR-0017 records both deviations with measured ratios for both themes, the criterion
  each violates, why it is accepted, and what would reverse it.
  _Why:_ an unrecorded deviation reads as an oversight to whoever finds it next; a recorded one is
  engineering.

## Open questions

- [ ] **Q-1** — Should ADR-0017 stay purely descriptive, or carry a recommended remediation?
      Planned as descriptive, since the instruction was "leave it, document it", with the three
      measured options recorded under _Options considered_ so a future decision starts from data.
      Non-blocking.

## Out of scope

- **Changing any Button colour token.** That is the decision ADR-0017 records as declined.
- No switcher on logged-out routes (`/login`, `/register`); those users keep `prefers-color-scheme`
  via the pre-paint script.
- No Sidebar placement — decided against, see `D-01`.
- No backfill of the older kits missing `README.md` / `decisions.md`. The templates bind kits created
  on or after 2026-09-19, and retrofitting a finished record falsifies it.
- `.claude/rules/architecture.md`'s layer table omits `constants` from the `components` row though
  `eslint.config.mjs` allows it. A real doc/config mismatch, but a separate change.

## Decisions expected

- **D-01** — Account page over Sidebar.
- **D-02** — Hydration guard shape.
- **D-03** — Accept both contrast deviations rather than repoint the tokens; promote to ADR-0017.

## Phases

### Phase 0 — the control

`src/components/ui/ThemeSwitcher.tsx`, wrapping the existing `SegmentedControl`. **No new CSS** — it
reuses the `segmented` recipe already registered in `globals.css`. Three options bound to
`useTheme().theme`; `mounted` tracked in a `useEffect`; `aria-label="Theme"`. Imports `next-themes`
and `@/ui/SegmentedControl` only — not `@/constants/app`, because `next-themes` owns storage via the
provider and `THEME_STORAGE_KEY` belongs in one place.

### Phase 1 — the surface

`src/app/(app)/account/page.tsx` — an Appearance `Card` below Profile, reusing the
`Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` set the page already imports.
Renders in the `data` branch only.

### Phase 2 — tests

`jest.setup.ts` gains a `window.matchMedia` shim: jsdom does not implement it and `next-themes`
calls it under `enableSystem`. Same class of gap, and the same guarded shape, as the existing
`Element.checkVisibility` and `HTMLElement.inert` shims.

- `src/components/ui/__tests__/ThemeSwitcher.test.tsx` — AC-1 and AC-5 through AC-8, plus `jest-axe`.
- `src/app/__tests__/theme-switching.int.test.tsx`, under `<StrictMode>` — AC-2 and AC-3 together,
  rendering `<Providers><ThemeSwitcher /></Providers>` so the real `attribute` / `storageKey` wiring
  is what is exercised rather than the library. **Prove it fails first** by temporarily flipping
  `attribute` in `providers.tsx`, per `.claude/lessons.md`, and report the result either way.

### Phase 3 — docs

Last, per `.claude/rules/workflow.md` § Review before docs.

- `docs/explanation/decisions/adr-0017-*.md`, Status **Accepted**.
- `docs/explanation/decisions/README.md` — register it in the Records table.
- `.claude/rules/styling.md` — correct the known-defect bullet, point at ADR-0017.
- `docs/reference/accessibility-baseline.md` §6.1 — note the deviation under the AA claim.
- `docs/reference/components/component-styling-tailwind-and-tokens.md` — add `ThemeSwitcher` to the
  `segmented` recipe's consumer row.

## Risks and trade-offs

- **Shipping a switcher makes light mode a deliberate destination while it fails two criteria.** It
  does not create the exposure — the pre-paint script already falls back to `prefers-color-scheme` —
  but it does increase it. Mitigated only by ADR-0017 landing in the same PR, not by a fix. This is
  the trade-off the "leave it, document it" call accepts, and it should be visible to a reviewer
  rather than implied.
- The `matchMedia` shim lands in shared setup and so touches every suite. Additive and guarded, but
  `jest.setup.ts` is a global file and a mistake there is repo-wide.

## Accessibility

Conditional section — applies; this is user-facing UI.

**Criteria this work must meet:** 2.1.1 Keyboard (AC-5), 2.5.3 Label in Name (AC-6), 2.5.8 Target
Size (Minimum) (AC-7), and 4.1.2 Name, Role, Value — the last satisfied by `SegmentedControl`'s
Ariakit `RadioGroup` over native radio inputs.

**Known deviations, accepted:**

| Deviation                                                                  | Criterion                                                                                                                                        | Why accepted                                                                                                                                                             | What would reverse it                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Button label contrast, 1.61–4.47:1 across variants and states, both themes | WCAG 1.4.3 Contrast (Minimum), and `.claude/rules/accessibility.md`'s rule that contrast meets AA against the semantic tokens in **both** themes | `.claude/rules/styling.md` fixes Button colour tokens as brand identity, and no repoint within the existing three-step ramps reaches 4.5:1 — any fix is a palette change | New darker ramp steps, or a per-state foreground inversion. An owner decision on the brand |
| Button boundary contrast, 1.64–3.00:1 against every light-mode surface     | WCAG 1.4.11 Non-text Contrast                                                                                                                    | Same root cause; most acute on the secondary/outline button, whose border is its only affordance                                                                         | Same                                                                                       |

Verification methods are named per criterion in the checklist's `## Acceptance`. `jest-axe` alone is
not claimed as coverage: `.claude/rules/accessibility.md` § Current tooling gaps records that axe
catches roughly a third of real issues, so AC-4, AC-5 and AC-7 get a manual pass. No e2e
accessibility is claimed — there is no `cypress-axe`.

## Success metrics

None stated. Nothing here is tracked anywhere it could be read back, and a metric with no reader is
a wish rather than a metric.

## Rollback

Not applicable — no deploy step and no destructive data change. Revert the PR.

## References

- `.claude/rules/styling.md` § Known token-system defects, § Hard rules
- `.claude/rules/accessibility.md` § Current tooling gaps
- [ADR-0016](../../../explanation/decisions/adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md)
- `.claude/lessons.md` § A test that passes before the fix is not a regression test
