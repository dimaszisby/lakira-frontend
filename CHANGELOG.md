# Changelog

Each section is one release: what a promotion of `dev` to `main` added. `npm run release:prepare`
writes it from the commit subjects, grouped by their Conventional Commit type, and the `release`
workflow publishes it as the notes of the GitHub release tagged `v<version>`. How to cut one:
[`docs/how-to/releases/promote-dev-to-main.md`](docs/how-to/releases/promote-dev-to-main.md).
Decision: [ADR-0045](docs/explanation/decisions/adr-0045-releases-are-versioned-on-dev-and-tagged-on-main.md).

## 0.1.0 - 2026-10-23

The state promoted to `main` in #147 (`66d4b65`), before releases were versioned. Untagged.
