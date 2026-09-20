# Architecture layer table omits `constants`

**Purpose:** `.claude/rules/architecture.md` understates what the boundary rule actually allows.
**Owner:** hardini
**Branch:** unassigned
**Found:** while adding `ThemeSwitcher` under `feat/theme-switching`, checking whether a component
may import `THEME_STORAGE_KEY`.

## What is wrong

`.claude/rules/architecture.md` § Layer boundaries prints:

```
components → lib, utils, types, generics
```

`eslint.config.mjs` actually declares:

```js
{ from: "components", allow: ["lib", "utils", "types", "generics", "constants"] },
```

`constants` is allowed and the doc omits it. The same omission runs through the whole table — the
rule allows `constants` from `app`, `features`, `components`, `services`, `lib`, `utils` and
`types`, and the doc lists it for none of them.

## Why it matters

This is the inverse of the 2026-08-17 lesson, where a doc claimed enforcement that did not exist.
Here the doc claims a restriction that is not enforced, which is the cheaper direction — but it
still misleads. It is why `Header.tsx` and `Sidebar.tsx` importing `@/constants/app` looks like part
of their quarantine when it is perfectly legal, and it cost a detour to establish that.

## The fix

- [ ] Add `constants` to every row of the table in `.claude/rules/architecture.md` that
      `eslint.config.mjs` allows it for.
- [ ] While there, note that `constants` is its own boundary element and depends on nothing.

Docs-only. No code change, no behaviour change.
