# Changelog

Each section is one release: what a promotion of `dev` to `main` added. `npm run release:prepare`
writes it from the commit subjects, grouped by their Conventional Commit type, and the `release`
workflow publishes it as the notes of the GitHub release tagged `v<version>`. How to cut one:
[`docs/how-to/releases/promote-dev-to-main.md`](docs/how-to/releases/promote-dev-to-main.md).
Decision: [ADR-0045](docs/explanation/decisions/adr-0045-releases-are-versioned-on-dev-and-tagged-on-main.md).

## 0.2.0 - 2026-10-27

### Fixes

- fix(deps): move fast-uri to 3.1.9 for four new advisories
- fix(deps): move to zod 4 to clear GHSA-mrhx-c7xc-m3w5
- fix(organizations): follow nextCursor on the members and org lists

### Other

- chore(repo): version releases on dev and tag them on main
- docs: fix stale and contradictory references
- chore(repo): move open work to GitHub Issues, one per task
- docs(tracker-as-code): record #154 and the clean audit
- chore(api): sync the OpenAPI snapshot with backend #221
- chore(repo): keep the issue tracker's labels and forms as code
- docs: close the docs-diet kit
- chore(api): sync the OpenAPI snapshot with backend #218
- docs: repoint lesson citations and record the spec sync in docs-diet
- chore(api): sync the OpenAPI snapshot with backend #217
- chore(api): sync the OpenAPI snapshot with backend #215
- docs: split closed register rows out and promote lessons into rules

## 0.1.0 - 2026-10-23

The state promoted to `main` in #147 (`66d4b65`), before releases were versioned. Untagged.
