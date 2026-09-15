# UI components refactor

**Purpose:** track the refactor and cleanup of `src/components/ui` on `refactor/ui-components`.
**Owner:** hardini

Scope agreed on 2026-09-11:

- Refs, exports and APIs:
  - React 19 ref-as-prop;
  - named exports only;
  - native prop names;
  - no form-library types in primitives.
- Rebuild the hand-rolled Modal, Select, DateTimePicker, ColorField and SegmentedControl on Ariakit.
- Move `CategorySelect` and `Visualization` into their feature modules.
- Styling:
  - colour tokens and CSS centralised, with no stray declarations inside components;
  - enforced by the Tailwind theme and lint rules.
- Consistency (sizes, radii, elevation, focus, disabled, motion, target size) without changing the app's identity: palette, brand mapping, fonts and type scale stay as they are.

## 0. Branch, baseline, tracking

- [x] Branch `refactor/ui-components` off an up-to-date `dev`
- [x] Baseline screenshots against `dev` (auth screens in both themes and widths; app screens in dark at 1280 px). Kept locally, not committed.
- [x] Contrast baseline for the semantic token pairs used by primitives, with failures reported
- [x] This todo file
- [x] `.claude/lessons.md` entry

### Contrast decisions (2026-09-11)

Baseline: 40 of 68 pairs failed WCAG AA. The owner approved these fixes. Each one reuses an existing palette step; palette values, brand mapping and Button tokens stay untouched.

| Fix                            | Light                                                        | Dark                                            |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| Focus ring                     | `origamiblue-500` → `-700` (2.28 → 3.53)                     | on `surface-2`: `origamiblue-100` (2.82 → 4.25) |
| Error text                     | `vividcoral-500` → `-700` (2.99 → 4.68)                      | `vividcoral-100` (2.83 → 4.55)                  |
| Info text                      | `info-500` → `info-700` (1.71 → 8.44)                        | same                                            |
| Selected-state text            | pink tint/fill kept; text becomes `gray-900` (2.15 → ≥ 6.27) | same                                            |
| Tertiary text and placeholders | secondary grey where tertiary fails (3.98–4.26)              | secondary grey (2.75–3.63 → ≥ 4.74)             |
| Control borders                | `gray-300` → `gray-500` (1.35 → 3.21)                        | `gray-700` → `gray-400` (1.32 → 3.63)           |

Success and warning text have no passing step in their ramps. They render as neutral text with a status icon.

Out of scope, and reported: Button tokens fail AA in light mode (primary and secondary 1.96, destructive 3.13, tertiary 2.68). Those are identity decisions for the owner.

## 1. Central foundations

- [x] Semantic tokens: `--text-emphasis` (equal to `--text`), `--overlay`, `--interactive-hover`, `--interactive-selected-*`
- [x] Scale tokens: control sizes, elevation, z-index, focus ring, disabled, motion, icon sizes, target size
- [x] Replace default-palette colour usages outside `ui/`
- [x] Restrict Tailwind `colors` to tokens (proven: `bg-white` generates no CSS)
- [x] Replace phantom `text-ink-muted` / `bg-muted` classes
- [x] Delete `src/styles/temp.css`
- [x] Stylelint colour rules (proven to fire on hex, `rgb()`, named colours)
- [x] `src/lib/compose-refs.ts`, `ui/Spinner.tsx`, shared `SortOrder`
- [x] `cn()` knows the named type scale (it was dropping `text-caption` next to a colour class)
- [x] Gates green

## 2. Convention, recipe and consistency sweep

- [x] Button, Card, Toggle
- [x] InputChrome, TextField, TextArea
- [x] ErrorMessage, FormField
- [x] SearchInput
- [x] Table (`.data-table` recipe; `.table` is a Tailwind utility)
- [x] SortChip, SortChipGroup
- [x] Pagination
- [x] Slider (thumb is `div role="slider"`; a `button` with that role fails axe)
- [x] SwipeableCard, including a keyboard alternative to swipe
- [x] DataLabel, IconLabel, EmptyDataIndicator, SkeletonLoader, FullScreenSpinner
- [x] Consumers, jest mocks, `@/ui/*` alias
- [x] Gates green (unit 65/500, integration 17/79, typecheck, Stylelint)

## 3. Ariakit rebuilds

- [x] Modal on Ariakit Dialog (`@modal` routes still to recheck in the manual pass)
- [x] SegmentedControl, ListModeToggle (native radios inside labels: Ariakit only selects on arrow-key focus for real `<input type="radio">`)
- [x] `jest.setup.ts` shims for jsdom: `Element.checkVisibility` (Ariakit tabbable detection) and `HTMLElement.inert` (avoids Ariakit's focus-patching polyfill colliding with user-event)
- [x] Select (trigger is `role="combobox"`; `name` submits with the form)
- [x] DateTimePicker (Popover plus a `role="grid"` Composite; arrow keys, PageUp/PageDown)
- [x] ColorField (Popover; hex editor is TextField, Apply is Button)
- [x] ESLint enforcement rules on, each proven to fire (planted file: 2 arbitrary values, 2 tints, 1 style key; nothing fires outside `ui/`)
- [x] Gates green (unit 65/513, integration 17/79, typecheck, ESLint 0 errors, Stylelint)

## 4. Relocations

- [x] CategorySelect → `src/features/metric-categories/components/`
- [x] Visualization → `src/features/data-visualizations/components/`
- [x] Quarantine reduced to 4 files; `CLAUDE.md` and `.claude/rules/architecture.md` updated

## 5. Documentation

- [x] ADR-0016 (supersedes ADR-0009, ADR-0010, ADR-0014); registry updated
- [x] `.claude/rules/styling.md`, `.claude/rules/accessibility.md`
- [x] Component styling reference, colour palette reference, design-tokens reference, code samples (tutorial, how-to, architecture §4 and §7)
- [x] Tick the item in `2026-08-17-todo-claude-code-setup.md`

## 6. Verification

- [x] Integration suite, `/pre-push` (API spec check fails on upstream backend drift; this branch does not touch the snapshot)
- [x] Mechanical greps, planted-violation proofs
- [x] Identity diff check
- [x] Manual pass against the baseline in the browser. Found and fixed three regressions (see Status). Not covered: the log modal (the "Add Logs" route is broken on `dev` too), list tables with data, light and 375 px variants of app screens, and reduced motion.

## Status

**2026-09-12: code, docs, automated gates and the browser pass complete.** The browser pass compared this branch with `dev` screen by screen and found three regressions, all fixed with tests (listed below).

Gates on the final tree:

| Gate                      | Result                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `lint`                    | 0 errors, 21 warnings (was 36 on `dev`; none in files this branch touches)                                   |
| `lint:css`                | clean                                                                                                        |
| `typecheck`               | clean                                                                                                        |
| `test:unit:ci`            | 71 suites, 593 tests; global coverage 30.88 / 35.78 / 29.98 / 30.10 % (`dev`: 29.13 / 30.93 / 27.68 / 29.20) |
| `coverage:check` (strict) | all folder goals met; `src/components/ui` 92.7 %                                                             |
| `test:integration`        | 17 suites, 80 tests                                                                                          |
| `api:types:check`         | in sync                                                                                                      |
| `api:spec:check`          | **fails**: the backend spec moved upstream. Not caused by this branch; run `/sync-api-types` separately      |
| `build`                   | passes                                                                                                       |

What changed beyond the plan, and why:

- **Coverage.** The Ariakit rebuilds deleted about 450 well-covered statements of hand-rolled widget code, which dropped global statement coverage to 26.67 % even though uncovered statements fell. The threshold was not lowered. Unit tests were added for pure, live modules with none: `normalizeApiError`, `lib/routes`, `dashboardFilters`, and the three list search-param modules.
- **Warnings in touched files.** `MetricLogsClient` effect dependencies, `RegisterForm` `watch()` → `useWatch` (React Compiler compatible), and a `react-refresh` `allowExportNames` entry for Next.js `metadata` / `viewport` exports, which cleared 12 false positives app-wide.

Found in the visual pass, and fixed:

- **`TextField` clear button and `TextArea` counter ignored react-hook-form values.** `register()` writes default and `reset()` values straight to the DOM node, but the refactored fields only tracked props and typing, so a pre-filled field hid its clear button and showed `0/255`. Both now re-read the node from the composed ref on each commit. Covered by react-hook-form tests in `TextField.test.tsx` and `TextArea.test.tsx`.

- **Modal remounted its content, which broke MetricSettingsForm's watched values in `next dev`.** Ariakit's portal renders the dialog in place for one commit, then moves it into its own node, which remounts the subtree. Under StrictMode the settings form's `shouldUnregister` fields unregistered and re-registered without notifying `useWatch`, so Priority showed nothing selected and watched toggles read `undefined`. `Modal` now portals with React's `createPortal` into a long-lived `#dialog-root` and passes Ariakit `portal={false}`. The container stays under `<body>`, so the transformed mobile sidebar cannot clip it. Covered by a StrictMode integration test in `MetricSettingsForm.int.test.tsx`, which passes on `dev`.
- **Hardening: `SegmentedControl` radios could lose their selection on a native form reset.** react-hook-form's bare `reset()` calls `form.reset()`, which restores associated radios to their initial state without React noticing. The radios now carry `form=""`, which detaches them from the form; they have no `name` and are never submitted. Covered by a test that fails without the attribute.
- **Select trigger centred its value.** `.picker-trigger` spaces its children apart, and `.picker-value` didn't grow, so the value sat mid-trigger. `.picker-value` now has `flex: 1`.

Follow-ups, not done here:

- Button colour tokens fail WCAG AA in light mode. A brand decision.
- Widen the arbitrary-value and opacity-tint lint rules beyond `ui/`.
- Map `--space-1..7` to Tailwind spacing (changes `*-7` utilities).
- `phosphor-react` → `@phosphor-icons/react`.
- MetricForm's duplicate-name check always fails with a 400, on `dev` and this branch alike. `useMetricsListViaOffset` sends `page`/`sortBy`/`sortOrder`/`name`, and the backend now rejects them: "Unrecognized key(s) in object: 'name', 'page', 'sortBy', 'sortOrder'". Move it to the cursor list endpoint.
- Sessions die about 15 minutes after login against the local backend, on `dev` and this branch alike. `ACCESS_TOKEN_TTL_SEC=900`; after that every proxied call returns 401 "Unauthorized: Invalid token". The proxy retries with `refreshAccessToken`, but neither dev server logged `proxy.refreshed` or `auth.refresh.rejected`, so the refresh cookie was never present on the request. Check whether `/api/auth/login` actually captures `lakira_refresh` from the backend's `Set-Cookie`. Every detail route then renders "Page not found", because `[metricId]/layout.tsx` turns any fetch failure into `notFound()`.
- Log Out never clears the session, on `dev` and this branch alike. `Sidebar` calls `logoutUser`, which posts to the backend's `/auth/logout` through the proxy. Nothing calls the Next route `src/app/api/auth/logout/route.ts`, the only code that deletes `lakira_token`, and the proxy drops the backend's cookies anyway. On "success" the app pushes to `/login`, which sees the cookie and returns 307 to `/dashboard`. The refresh cookie is never cleared either.
- `/login` and `/register` redirect to the dashboard whenever a session cookie exists, without checking it. A token the backend rejects therefore traps the user: "log in again" skips the form, and every call returns 401 "Unauthorized: Invalid token". Seen on 2026-09-12, with host and container clocks in sync and the backend container up for 2 weeks. The redirect should use `isSessionTokenUsable`, and a 401 that refresh cannot fix should clear the cookie.
- Hard-loading `/metrics/:id/logs/new` renders "Page not found" on `dev` and this branch alike. The request is served by `logs/[logId]/page.tsx` with `logId="new"`, which fetches `/metric-logs/new` and calls `notFound()`. The in-app "Add Logs" button lands there too, so logs cannot be added through the UI. Check the incident doc `fix-metric-modal-routing-20251130.md`.
- `/account` stays on "Loading…" forever in `next dev`, on `dev` and this branch alike. `withAuth` guards its bootstrap with `startedRef`, so StrictMode's second effect run returns early after the first run's cleanup set `cancelled`, and `setChecking(false)` never fires.
- `public/scripts/theme-init.js` reads `lakira.theme`, but next-themes stores the choice under its default key `theme`, so the pre-paint script can apply the wrong theme.
- `src/utils/theme.ts` is unused, and its `resetTheme` re-stores the theme, so it never returns to following the system. Delete it or fix it.
- `.claude/rules/testing.md` still describes coverage thresholds as 3/2/3/3 % placeholders that gate nothing; `CLAUDE.md` and CI say otherwise.

## What these follow-ups turned out to be (2026-09-15)

All thirteen were worked in PRs #18–#26. Each has its own todo file under `docs/internal/todos/`.
Recorded here because **three of the diagnoses above did not survive investigation**, and anyone
reading this list should know that before trusting the rest of it.

- **`/metrics/:id/logs/new` "Page not found"** — no `/metric-logs/new` fetch happens anywhere. The
  404 was the _session_ bug below: `[metricId]/layout.tsx` turns any fetch failure into
  `notFound()`. The real defect was a malformed route interception — `@modal` held `(.)new` and
  `(.)[logId]`, two interceptors matching the same segment, so Next built `…/logs/(.)(.)new` and
  threw. It hid behind a fallback to a full page load, so the modal still appeared. (#21)
- **Sessions dying at 15 minutes** — `/api/auth/login` was dead code; nothing imported it. Login
  runs through `/api/proxy/auth/login`, and the proxy discarded the backend's `Set-Cookie`. Fixing
  it also required coalescing refresh, since the backend revokes the whole token family on replay
  and parallel queries would otherwise 401 together. (#18)
- **Mapping `--space-*` changing `*-7` app-wide** — no `*-7` utility exists in the codebase and none
  is generated in the build. The change moved no pixel. (#26)
- **The theme key mismatch** was real but **latent**: nothing calls `useTheme` or `setTheme`, so no
  stored theme was ever written. There is no theme switcher in the UI. (#20)

Two findings worth carrying forward, neither on this list:

- **The edge session gate had never run.** `middleware.ts` sat at the repository root while `app` is
  at `src/app`, and Next 16 renamed the convention to `proxy`. It is now `src/proxy.ts`. (#18)
- **Four phantom colour classes across six sites**, including both route error boundaries, which had
  been rendering with no error styling at all. `tailwind.config.mjs` replaces Tailwind's palette, so
  a class naming an undefined colour generates no CSS — silently. Guarded now by
  `src/styles/__tests__/colour-classes.test.ts`. (#24)

**Still open: the Button contrast item.** It is a brand decision rather than a task — measurements
are in this file's contrast section above, and nothing was changed.
