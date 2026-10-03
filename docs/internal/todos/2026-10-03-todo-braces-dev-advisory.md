# 2026-10-03 - Todo: the nightly audit is red on an unpatched `braces` advisory

**Context:** found on the first dispatched run of `dependency-audit` after #64 merged (run
37131845770, `dev` at 77fa8e3, 2026-10-03 15:02 UTC). `security:audit:full` exited 1 with "47 high
severity vulnerabilities". All 47 trace to one advisory:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), `braces` vulnerable to
stack-exhaustion denial of service through deeply nested patterns. The other 46 are packages that
depend on it, mostly the Jest tree.

What is known, checked on 2026-10-03:

- No patched version exists. The advisory covers `braces` `<= 3.0.3`, which is the latest release,
  so `npm audit fix` has nothing to move to. It was last updated 2026-10-02 22:36 UTC, after #64's
  gates ran.
- `braces` is not in the production tree: `npm ls braces --omit=dev` is empty and `security:audit`
  reports 0 vulnerabilities. Nothing that ships is affected and pull requests are not blocked.
- It arrives through `micromatch` (`eslint-plugin-boundaries`, Jest) and `chokidar`
  (`tailwindcss`). All are development tooling fed patterns from this repo's own config.

This is the case ADR-0023 exists for: a development-tool advisory surfaces in the nightly run
instead of failing unrelated work. The cost is a nightly run that stays red until `braces` ships a
fix, and a job that is always red hides the next new advisory.

Decided 2026-10-03: record it and leave the nightly red. No exception list, and AC-3 of the
`dependency-audit-split` kit is not reworded; it stays open until a green run exists.

## Checklist

- [ ] Watch the advisory for a patched `braces`; when one ships, update the lockfile
      (`npm update braces`, or an `overrides` entry if `micromatch` pins it) in its own PR
- [ ] Dispatch `dependency-audit` on `dev` (`gh workflow run dependency-audit --ref dev`) and
      confirm it is green, checked by name
- [ ] Tick AC-3 in
      `docs/internal/initiatives/dependency-audit-split/dependency-audit-split-checklist.md` and
      update that kit's README Status
- [ ] If no patch has shipped by 2026-11-03, revisit: a dated exception for this one advisory
      changes what the gate checks, so it needs a `decisions.md` entry in the kit

## Status
