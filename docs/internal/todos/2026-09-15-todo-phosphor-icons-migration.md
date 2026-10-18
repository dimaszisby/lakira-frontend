# phosphor-react → @phosphor-icons/react

**Purpose:** ticket 10 from the UI-refactor follow-ups.
**Owner:** hardini
**Branch:** `chore/phosphor-icons-migration` off `dev`

`phosphor-react@1.4.1` is the unmaintained predecessor of `@phosphor-icons/react`; v2 is the
maintained line under the Phosphor org.

## What changed

- [x] `@phosphor-icons/react@2.1.10` installed, `phosphor-react` removed.
- [x] 32 files rewritten. **Only the package specifier changed** — every import was already a named,
      per-icon import, so no call site or prop needed touching.
- [x] `.claude/rules/performance.md` updated, since it named the old package in its icon guidance.

## All 34 icon names verified present in v2

Checked against the shipped modules in `dist/csr` rather than assumed:

`Bell CalendarBlank Calendar CaretDown CaretLeft CaretRight CaretUp ChartBar Check Clock
DotsThreeVertical EyeSlash Eye Files FloppyDisk Folder Lightning Minus Palette PencilSimpleLine
PencilSimple Plus Presentation SignOut SquaresFour Tag Target Trash TrendUp UserCircle UsersThree
WarningCircle XCircle X`

None missing. (An initial check via `require()` reported all 34 missing — that was an ESM/CJS
resolution artifact of the package's exports map, not a real result. Worth knowing before trusting a
`require()` probe against an ESM-only package.)

## Verification

| Gate                      | Result                                             |
| ------------------------- | -------------------------------------------------- |
| `lint`                    | 0 errors, 17 warnings — exactly the `dev` baseline |
| `lint:css`                | clean                                              |
| `typecheck`               | clean                                              |
| `test:unit`               | 77 suites, 646 tests                               |
| `test:integration`        | 18 suites, 92 tests                                |
| `coverage:check --strict` | all goals met                                      |
| `build`                   | passes                                             |

Icons confirmed rendering in `next dev` with a cleared `.next`: sidebar navigation glyphs, the `+`
on Create Metric, category folder icons, the eye-slash on Private rows, and Sign Out.

A green build alone would not have caught a missing icon — an undefined export renders as nothing
rather than throwing — which is why this was checked in the browser.

## Keeping the diff honest

`eslint --fix src` also autofixed five files with no phosphor import — pre-existing import-order and
`sonarjs` warnings in `useRouteSync`, `sanitizeErrorMessage`, `cursorSort.test`, and two
metric-category route files. Those were reverted. They are real warnings worth clearing, but they
belong to their own change, not to an icon migration; sweeping them in would have made the diff
misreport what it does.

## Not done

**Bundle impact was not measured.** The stated reason for this migration is maintenance, not size,
and `npm run perf:bundle-size` needs a full perf run to compare meaningfully. If the number matters,
run it against `dev` and this branch.

## Bundle impact, measured 2026-10-18

Register row F-40. The migration is one commit, `3b84022`, so it was measured against its parent,
`822bff1`, the only difference between the two being the icon package. Each commit was exported with
`git archive`, installed with `npm ci` from its own lockfile and built on Node 24.21.0 with no
`.env`. Then `npm run perf:bundle-size` ran on each, and a throwaway script summed each chunk's
gzip size (level 9).

| `.next/static/chunks` | Before, `phosphor-react` 1.4.1 | After, `@phosphor-icons/react` 2.1.10 | Change             |
| --------------------- | ------------------------------ | ------------------------------------- | ------------------ |
| Total JS, raw         | 2,220,553 B                    | 2,149,957 B                           | -70,596 B (-3.2 %) |
| Total JS, gzip        | 662,230 B                      | 692,217 B                             | +29,987 B (+4.5 %) |
| Chunk files           | 56                             | 56                                    | 0                  |
| Largest chunk         | 233,213 B                      | 233,213 B                             | 0                  |

- **Not noise.** A second build of `822bff1` was byte-identical to the first.
- **Both versions tree-shake.** An icon the app never imports is in no chunk, while one it does
  import is there:
  - v1: `Activity` in no chunk, `Trash` in 7;
  - v2: `Acorn` in no chunk, `Trash` in 7.
- **What it means against the budget.** The budget CI enforces counts raw bytes
  (`performance-thresholds.json`: 3,000,000 total, 300,000 largest chunk). By that measure the
  migration made the bundle smaller. What a browser downloads, the gzip size, grew by about 29 KB
  summed over every chunk. A single page loads only some of the chunks, and per-route sizes were not
  measured.
- **Why gzip went up while raw went down** is not established. Inference: v2's icon modules compress
  less well than v1's, which repeated the same structure for each weight.

No change follows from this. The migration was for maintenance, the enforced budget improved, and
nothing reached a threshold.
