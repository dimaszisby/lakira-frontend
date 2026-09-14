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

| Gate | Result |
| --- | --- |
| `lint` | 0 errors, 17 warnings — exactly the `dev` baseline |
| `lint:css` | clean |
| `typecheck` | clean |
| `test:unit` | 77 suites, 646 tests |
| `test:integration` | 18 suites, 92 tests |
| `coverage:check --strict` | all goals met |
| `build` | passes |

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
