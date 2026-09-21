# Drop withAuth — Checklist

## Phase 0 — the usage

- [x] `src/app/(app)/account/page.tsx` — `withAuth` wrapper removed, `AccountPageBase` renamed to
      `AccountPage` and exported directly.

## Phase 1 — the deletions

- [x] `src/components/hoc/withAuth.tsx` and `src/components/hoc/__tests__/withAuth.int.test.tsx` —
      the directory is now gone.
- [x] `src/components/providers/HydrateUser.tsx` — referenced nowhere; directory gone.
- [x] `src/hooks/useAuth.ts` — unreferenced, and imported `useRouter` from `next/router`.

## Phase 2 — the quarantine

- [x] `eslint.config.mjs` — the exempt list is `Header.tsx` and `Sidebar.tsx`. The comment records
      that the list has only ever shrunk, and by which of the two routes off it.
- [x] Boundary rule verified still passing with the shorter list: `npm run lint` reports 0 errors,
      so neither remaining file needed the removed entries.

## Phase 3 — the claims that are now false

Every live document asserting a four-file quarantine, plus two that were already stale.

- [x] `CLAUDE.md` § Known state — four files → two.
- [x] `.claude/rules/architecture.md` § Layer boundaries — four files → two.
- [x] `docs/explanation/architecture/layers-and-boundaries.md` § The quarantine — said **six**, was
      already wrong since 2026-09-11; now two, with both exit routes explained.
- [x] `docs/explanation/product-requirements.md` §12.6 — `useAuth.ts` described as present-but-dead;
      now marked deleted.
- [x] `docs/internal/todos/2026-08-17-todo-claude-code-setup.md` — the tracking entry split, with
      the `withAuth`/`HydrateUser` half marked done and the reasoning recorded.

Deliberately **not** touched: `docs/internal/audits/**` and the dated todos from 2025-11 through
2026-09-13. Those are records of what was true when written — `.claude/rules/documentation.md`
forbids reformatting audits and rewriting finished initiatives.

## Discovered

- [x] Found: `withAuth` seeded a hand-written `["userProfile"]` cache key while the feature module
      uses `authKeys.profile()`. Nothing read the hand-written one → in scope; it goes with the
      file, and `D-01` records it because it changes the case from "duplicated work" to "work that
      was never wired up".
- [x] Found: `HydrateUser.tsx` is referenced nowhere at all → in scope, deleted.
- [x] Found: `layers-and-boundaries.md` claimed six quarantined files, stale since 2026-09-11 → in
      scope, corrected while editing the same section.
- [x] Found: `/account` had no test of its own, and the deleted `withAuth.int.test.tsx` was the only
      coverage touching its auth path → in scope, `AccountPage.int.test.tsx` added.

## Acceptance

Method as well as artifact.

- [x] AC-1 — `/account` renders the profile with no guard · interaction ·
      `AccountPage.int.test.tsx`
- [x] AC-2 — a profile that does not load shows the recovery card, **not** a redirect · interaction ·
      `AccountPage.int.test.tsx`. This is the one real behaviour change; see `D-02`.
- [x] AC-3 — the theme switcher still renders on the page · interaction ·
      `AccountPage.int.test.tsx`
- [x] AC-4 — no axe violations on the page · jest-axe · `AccountPage.int.test.tsx`
- [x] AC-5 — the boundary rule still passes with two files exempt rather than four · **a machine
      checked it** · `npm run lint`, 0 errors
- [x] AC-6 — no live document still claims a four-file quarantine · **I checked it** · grep over
      `src`, `docs`, `.claude`, `CLAUDE.md`, `eslint.config.mjs`; remaining hits are all dated
      records that must not be rewritten

Not claimed: a browser pass. The change is a deletion of a redundant gate, and the two gates that
remain are server-side and unchanged. The behaviour change is pinned by AC-2.

## Gates

- [x] lint — 0 errors, 16 warnings (down from the 17 baseline; a deleted file carried one)
- [x] css lint — **not triggered**, no CSS changed; run and reported anyway
- [x] typecheck
- [x] format
- [x] unit tests — 80 suites / 669 tests
- [x] integration — triggered, auth path changed; 19 suites / 99 tests (four deleted, four added)
- [x] spec drift — **not triggered**; run anyway, both in sync
- [x] build
- [ ] e2e — **skipped, not run**; **not triggered**
