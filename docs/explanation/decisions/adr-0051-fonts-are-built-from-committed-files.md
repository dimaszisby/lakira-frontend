# ADR-0051 — Fonts are built from committed files, not downloaded from Google

- **Status:** Accepted
- **Date:** 2026-11-12
- **Related:** supersedes in part [ADR-0031](./adr-0031-fonts-are-self-hosted.md): the fonts no
  longer come from `next/font/google`. ADR-0031's decision about the Content Security Policy
  stands unchanged.
- **Origin:** issue #201, under two days and so without a kit

---

## Context

`src/app/fonts.ts` loaded Quicksand and Plus Jakarta Sans with `next/font/google`. That loader
downloads each font from Google while `next build` runs, then serves the files from this origin
(ADR-0031). So every job that builds the app also depends on Google: "E2E tests" and "Production
image" on each pull request, and the nightly `stack-e2e.yml` and `performance.yml`.

On PR #200 (run 42771232704, attempt 1), "E2E tests" failed at its build step with
`Can't resolve '@vercel/turbopack-next/internal/font/google/font'` and
`next/font/google queries have exactly one entry`. The same commit built in two other jobs of that
run, and a re-run passed with no change.

What was checked on 2026-11-12, with Next 16.4.2:

- **With outbound HTTPS blocked** (a macOS `sandbox-exec` profile denying TCP to port 443), the
  `dev` loader fails the build every time: `next/font: error: Failed to fetch Plus Jakarta Sans
from Google Fonts`. The build depends on that download.
- **That message is not the one CI showed.** CI's message comes from the `next/font/google`
  import-map code inside Turbopack's native binary. So a failed download is a likely cause of the
  CI failure but not a proven one; it could also be a fault elsewhere in that loader.
- **With this change**, the same blocked build passes.

## Decision

The two font files are committed under `src/app/_fonts/` and loaded with `next/font/local`. The
build reads them from disk and fetches nothing. The browser side is unchanged: the files are still
served from `/_next/static/media/`, and `font-src 'self' data:` still covers them.

- **Quicksand is the whole font,** the unmodified google/fonts file converted to WOFF2 and nothing
  else. "Quicksand" is a Reserved Font Name. The OFL FAQ (2.6, and SIL's paper on webfonts and
  Reserved Font Names) treats a subset as a Modified Version, which may not carry that name without
  the authors' written permission. Compression alone is not a modification (FAQ 2.2.1).
- **Plus Jakarta Sans is the Latin subset** from `@fontsource-variable/plus-jakarta-sans@5.3.0`. It
  has no Reserved Font Name, so a subset may keep its name.
- **Each licence file sits beside its font,** as OFL 1.1 requires (FAQ 1.10).
- **`next/font/google` is banned by lint.** A `no-restricted-imports` pattern in
  `eslint.config.mjs` points here, so the loader cannot come back without this record changing.

`src/app/_fonts/README.md` records each file's source, version or commit, sha256, and how to
refresh it.

## Options considered

- **Retry the build step in CI.** Rejected: it hides the failure rather than removing it, and it
  needs a `.github/workflows` edit for each of the four jobs that build.
- **Leave it and re-run failed jobs by hand.** Rejected: a required check failing on an unchanged
  commit costs a manual re-run, and anyone who does not know about it reads a red check as a real
  regression.
- **Install `@fontsource-variable/*` and import its CSS.** Rejected: it keeps every subset, but adds
  two runtime dependencies, and loses what `next/font` gives, which is the preload link and the
  metric-adjusted fallback face that keeps layout shift down.
- **Commit Fontsource's Latin subset of Quicksand.** Rejected on the licence: see Decision.
- **Rename a Quicksand subset.** Rejected: the brand font would then ship under another name, and
  the font's internal name table would need editing.

## Consequences

- No step of `next build` needs the network for fonts. A build of an unchanged commit no longer
  depends on Google being reachable from the runner.
- **If #201's exact message comes back,** the cause was not the download. Reopen #201 with the run.
  `next/font/local` has an import-map path of its own with a matching message.
- **The first page load preloads 80 KB of fonts instead of 55.6 KB.** Quicksand grows from a
  28.3 KB Latin subset to the 52.7 KB whole font. Plus Jakarta Sans stays at 27.3 KB.
- **Plus Jakarta Sans covers Latin only.** Before, `next/font/google` also served Latin Extended,
  Vietnamese and Cyrillic Extended files behind `unicode-range`, fetched only when a page used
  them. Body text in those scripts, such as a name with "ł" or "ő", now renders in the fallback
  face. Quicksand, being whole, covers every script it has.
- **Updates are manual.** A new release of either font reaches the app only when someone refreshes
  the file, following `src/app/_fonts/README.md`.
- **Revisit** if body text outside Latin becomes common enough to need Plus Jakarta Sans's other
  subsets. `next/font/local` cannot split one family by `unicode-range`, so that would be the whole
  font, as Quicksand is.

## References

- #201 — the failure and the options
- [`../../../src/app/_fonts/README.md`](../../../src/app/_fonts/README.md) — sources, hashes, refresh steps
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` — `next/font/local`
- [OFL FAQ](https://openfontlicense.org/ofl-faq/), entries 1.10, 2.2.1 and 2.6, and
  [Web Fonts and Reserved Font Names](https://openfontlicense.org/webfonts-and-reserved-font-names/)
