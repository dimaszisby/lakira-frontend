# Theme switching — decisions

## D-01 — The switcher lives on `/account`, not in the Sidebar

- **Status:** Accepted
- **Date:** 2026-09-20

**Context.** The control needs a home. `Header.tsx` renders only when there is no user, so it
reaches exactly the audience that cannot have a stored preference. That leaves the Sidebar, which is
on every authenticated page, or the Account page, which is the settings surface.

**Decision.** An Appearance card on `/account`, below Profile.

**Options considered.**

- _Sidebar, above Sign Out._ Better discoverability, which matters because the motivating complaint
  was that nobody had seen light mode. Rejected on two counts: `Sidebar.tsx` is one of the four
  files quarantined from the layer rule at the bottom of `eslint.config.mjs`, and
  `.claude/rules/architecture.md` says not to add to that list or copy its import pattern; and it
  renders twice — a desktop `<aside>` and a mobile drawer — so the control would be duplicated in
  the DOM, giving two radio groups with the same accessible name.
- _Both, with a compact Sidebar variant._ Roughly double the work and the test surface for a
  first cut, and it still means editing the quarantined file.

**Consequences.** The control is two clicks from anywhere rather than always visible. Logged-out
users on `/login` and `/register` cannot switch; they keep `prefers-color-scheme` via the pre-paint
script, which is the behaviour they have today. The Account page gains its first setting, which
gives a later Appearance section somewhere obvious to grow.

## D-02 — Before mount, render the control disabled rather than returning `null`

- **Status:** Accepted
- **Date:** 2026-09-20

**Context.** `useTheme()` returns `undefined` on the server and on the first client render, because
the stored preference is only readable after hydration. Rendering the real value immediately is a
hydration mismatch.

**Decision.** Track `mounted` in a `useEffect` and, until it is true, render `SegmentedControl` with
`value={null}` and `disabled`. Both are already part of its public props (`value: T | null`,
`disabled`), so this needs no change to the primitive.

**Options considered.**

- _Return `null` until mounted._ Simplest, and the common recipe in `next-themes` examples. Rejected
  because the card would grow by the control's height on hydration — a layout shift on a page that
  has a CLS budget in `.claude/rules/performance.md`.
- _Render with `suppressHydrationWarning`._ Silences the symptom without fixing the mismatch, and
  the first paint would still show the wrong segment selected.

**Consequences.** One frame where the group is present, unselected and not operable. The layout is
stable across hydration, and the disabled state is honest about the control not yet being usable.

## D-03 — Accept the Button contrast deviations; do not repoint the tokens

- **Status:** Accepted
- **Date:** 2026-09-20

**Context.** Button colour tokens fail WCAG 1.4.3 in both themes and WCAG 1.4.11 against every
light-mode surface. Shipping a theme switcher makes light mode a deliberate destination, so the
deviation needed a decision rather than continued silence. The measured tables are in
[the plan](theme-switching-plan.md) § Context and goals.

**Decision.** Accept both, change no Button colour token, and record the deviation as an ADR so it
stops being rediscovered.

**Options considered.**

- _Repoint each token to a different step of the ramp it already uses_ — the approach PR #17's
  contrast pass took for focus rings, error text and control borders. Rejected because it does not
  work: each hue has only three steps, and `matchagreen-700` under white text is 3.12:1,
  `softlavender-700` 4.39:1. Both still short of 4.5:1. This was the assumed cheap fix going in, and
  measuring it is what ruled it out.
- _Darken the foreground instead, as dark mode already does._ Fixes the rest states (primary 1.95 →
  7.15 with `--gray-900`) but breaks hover, because hover is the darker ramp step — rest and hover
  want opposite foregrounds.
- _Darken the fills enough for white text._ Needs relative luminance ≤ 0.183; the brand hues sit at
  0.28–0.49, so every one would go near-black. That is a redesign.
- _Change nothing and say nothing._ The status quo. Rejected: an unrecorded deviation reads as an
  oversight, and this one had already been rediscovered and mis-scoped once.

**Consequences.** The app ships a known AA failure on its most common interactive element, now
documented with the criterion, the measurements and the reversal condition. `.claude/rules/styling.md`
keeps Button colour tokens as fixed brand identity. Any real fix is a palette change needing new
ramp steps, which is an owner decision and not a refactor.

> **Promoted to [ADR-0017](../../../explanation/decisions/adr-0017-accept-the-button-contrast-deviations.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.
