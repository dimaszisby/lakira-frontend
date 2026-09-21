# Theme switching — Checklist

## Phase 0 — the control

- [x] `src/components/ui/ThemeSwitcher.tsx` — client component wrapping `SegmentedControl` with
      System / Light / Dark bound to `useTheme()`; `mounted` guard per `D-02`;
      `aria-label="Theme"`. No new CSS: reuses the `segmented` recipe.

## Phase 1 — the surface

- [x] `src/app/(app)/account/page.tsx` — Appearance `Card` below Profile, in the `data` branch only.

## Phase 2 — tests

- [x] `jest.setup.ts` — guarded `window.matchMedia` shim alongside the existing
      `Element.checkVisibility` and `HTMLElement.inert` shims.
- [x] `src/components/ui/__tests__/ThemeSwitcher.test.tsx` — unit, with `jest-axe`.
- [x] `src/app/__tests__/theme-switching.int.test.tsx` — integration, under `<StrictMode>`,
      rendering `<Providers><ThemeSwitcher /></Providers>`.
- [x] Demonstrate the integration test failing against a deliberately broken `attribute` in
      `providers.tsx`, then restore. Record the outcome either way.

## Phase 3 — docs

- [x] `docs/explanation/decisions/adr-0017-accept-the-button-contrast-deviations.md` — Status
      Accepted, both measured tables, both criteria by number, reversal condition.
- [x] `docs/explanation/decisions/README.md` — ADR-0017 added to the Records table.
- [x] `.claude/rules/styling.md` — known-defect bullet corrected to both themes and both criteria,
      pointing at ADR-0017.
- [x] `docs/reference/accessibility-baseline.md` §6.1 — deviation noted under the AA claim.
- [x] `docs/reference/components/component-styling-tailwind-and-tokens.md` — `ThemeSwitcher` added
      to the `segmented` recipe's consumer row.

## Discovered

- [x] Found: `--button-destructive-fg` is never overridden for dark, so 1.4.3 fails in dark too →
      in scope, folded into ADR-0017's tables.
- [x] Found: WCAG 1.4.11 Non-text Contrast fails for every button boundary in light mode, which was
      not previously recorded anywhere → in scope, added to ADR-0017 as the second deviation.
- [x] Found: `.claude/rules/architecture.md`'s layer table omits `constants` from the `components`
      row though `eslint.config.mjs` allows it → out of scope, filed as
      `docs/internal/todos/2026-09-20-todo-architecture-layer-table-drift.md`.
- [x] Found: two pre-paint theme scripts ship in the same document — the repo's
      `public/scripts/theme-init.js` and one `next-themes` injects itself, both reading
      `lakira.theme` → out of scope, filed as
      `docs/internal/todos/2026-09-20-todo-two-pre-paint-theme-scripts.md`.
- [x] Found: `useState` + `useEffect` for the mount guard is rejected by the React Compiler lint
      rule "Calling setState synchronously within an effect" → in scope, resolved with
      `useSyncExternalStore`; `D-02` records the shape, this records why the familiar idiom is not
      available here.

## Acceptance

Method as well as artifact — "a machine checked it", "I checked it" and "nobody checked it" are
three different states.

- [x] AC-1 — interaction · `ThemeSwitcher.test.tsx` (2 tests) and `theme-switching.int.test.tsx`
- [x] AC-2 — interaction · `theme-switching.int.test.tsx`; **proven to fail** against `attribute="class"`
- [x] AC-3 — interaction · `theme-switching.int.test.tsx`; **proven to fail** against `storageKey="theme"`
- [x] AC-4 — **manual browser pass**, 2026-09-20. Shipped unverified in PR #35: the Claude in Chrome
      extension was unavailable, and the structural argument — the `next-themes` pre-paint script is
      the first node in `<body>` and reads the same key the test asserts — is not the same as
      watching for a flash. Closed out by storing `light`, then navigating fresh to `/account`:
      `data-theme` was already `light` on arrival and the loading state itself rendered light, so
      the theme was applied before first paint. No dark flash.
- [x] AC-5 — **manual keyboard pass**, 2026-09-20. Also shipped unverified in PR #35, and the one
      that most needed a browser: `.claude/rules/accessibility.md` records that Ariakit selects on
      arrow-key focus only when the radio is a real `<input type="radio">`, which no jsdom test can
      demonstrate. With focus on the group, `ArrowRight` gave
      `{focused: "light", checked: ["light"], dataTheme: "light", stored: "light"}` — focus moved
      **and** selection followed, and the page repainted. Click-to-select remains covered by
      `ThemeSwitcher.test.tsx`.
- [x] AC-6 — jest-axe · `ThemeSwitcher.test.tsx`, plus by-role queries on all three names
- [x] AC-7 — **derived from tokens**, not measured in a browser: `.segmented[data-size="md"]` is
      `--control-h-md` (48px) with `--space-1` (4px) padding, so each item is 40px tall, and
      `--segmented-item-min-width` is 4rem (64px). 40x64 against the 24x24 required.
- [x] AC-8 — interaction · asserted against `renderToStaticMarkup`, not RTL: `render` flushes
      effects inside `act`, so the pre-mount state is unobservable through it and an RTL assertion
      would have asserted nothing. The integration test runs under `<StrictMode>`.
- [x] AC-9 — **I checked it** · ADR-0017 reviewed against the measured tables in the plan

## Closing note — the deviation, seen

Switching to light mode on 2026-09-20 was the first time anyone had actually looked at it, which was
half the point of building the switcher. ADR-0017's numbers hold up visually: on `/account` the
secondary "Refresh profile" button renders pale green on white and is hard to pick out against the
card — the 1.95:1 in the table, in the wild.

Recorded here rather than in ADR-0017, which is immutable per
`.claude/rules/documentation.md` § Decisions and ADRs. It confirms that record; it does not change
it, and a future contrast pass supersedes rather than edits.

## Gates

Acceptance proves the thing was built; gates prove nothing else broke.

- [x] lint
- [x] css lint — clean; **not triggered**, no CSS changed; will be run and reported anyway
- [x] typecheck
- [x] format
- [x] unit tests
- [x] integration — triggered, a new integration suite lands
- [x] spec drift — ran anyway, both in sync; **not triggered**, no backend contract or `src/types/dtos/**` in play
- [x] build
- [ ] e2e — **skipped, not run**; **not triggered**, no release and no end-to-end flow changed
