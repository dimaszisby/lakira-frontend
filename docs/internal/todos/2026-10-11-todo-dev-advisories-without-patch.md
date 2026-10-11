# 2026-10-11 - Todo: two development-only advisories that no update clears

**Context:** finding N14 of
[`audit-2026-10-10.md`](../audits/saas-readiness/audit-2026-10-10.md) listed six advisories in four
development-only packages and noted that only `braces` was tracked. Traced on 2026-10-11 on `dev`
at `4c62b97` (Node 24.21.0, npm 11.19.0). `handlebars` had a patch and was updated on
`chore/dev-advisories-n14`. `braces` stays with
[`2026-10-03-todo-braces-dev-advisory.md`](2026-10-03-todo-braces-dev-advisory.md). The two below
have no version that `npm update` can move to.

Neither is in the production tree: `npm run security:audit` reports 0 vulnerabilities. Both are
moderate, and the nightly gate is `npm audit --audit-level=high`, so neither is what keeps the
`dependency-audit` job red. They are recorded so the tracked list matches what `npm audit` prints.

## Findings

| Package                   | Installed         | Advisory                       | Arrives through                                                         | What would clear it                              |
| ------------------------- | ----------------- | ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `postcss-selector-parser` | 6.1.4, two copies | GHSA-rj75-hqrm-r3gf (moderate) | `tailwindcss` 3.4.18, and its `postcss-nested` 6.2.0                    | `tailwindcss` 4, a major migration               |
| `sprintf-js`              | 1.0.3             | GHSA-hp3w-g68c-fv3c (moderate) | `ts-jest` > `babel-plugin-istanbul` > `js-yaml` 3.15.2 > `argparse` 1.x | Jest 30, a major migration; or an upstream patch |

What is known, checked on 2026-10-11:

- **`postcss-selector-parser`.** The advisory covers every version below 7.1.6. `tailwindcss` 3
  declares `^6.1.2` (3.4.19, the latest 3.x, still does) and `postcss-nested` 6.2.0 declares the 6.x
  line too, so no 6.x release is patched and none can be reached inside the declared ranges.
  `stylelint`'s own copy is already 7.1.6 and is not reported.
- **`sprintf-js`.** The advisory covers every version up to 1.1.3, which is the latest release. No
  patched version exists. It is reached only through `js-yaml` 3, which `babel-plugin-istanbul`
  uses to read coverage configuration.

Decided 2026-10-11, in the plan the owner approved: no `overrides` entry forces
`postcss-selector-parser` 7.x under `tailwindcss` 3. That would cross a major version inside the
tool that generates the shipped CSS, for a moderate advisory in a parser fed only this repository's
own selectors.

## Checklist

- [ ] `postcss-selector-parser`: clears when the repository moves to `tailwindcss` 4. If that
      migration is planned, name this advisory in its kit; until then nothing to do
- [ ] `sprintf-js`: watch the advisory for a patched release; when one ships, `npm update sprintf-js`
      in its own PR. A move to Jest 30 also clears it
- [ ] When either clears, confirm with `npm audit` that the package is gone from the report, and
      tick it here

## Status
