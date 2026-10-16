# ADR-0031 — Fonts are self-hosted; the CSP names no font host

- **Status:** Accepted
- **Date:** 2026-10-16
- **Origin:** debt register row F-54 — [`2026-10-16-todo-csp-drop-font-hosts.md`](../../internal/todos/2026-10-16-todo-csp-drop-font-hosts.md)
- **Related:** [ADR-0030](./adr-0030-inline-style-stays-allowed.md), whose list of places CSS may
  fetch from this record shortens by two hosts. ADR-0030's decision is unchanged.

---

## Context

The page policy built by `src/lib/csp.ts`, and the static policy in `next.config.ts`, allowed
`https://fonts.googleapis.com` in `style-src` and `https://fonts.gstatic.com` in `font-src`.
ADR-0030 named both in the list of sources CSS may fetch from, and a unit test pinned that list.

The app's two fonts, Quicksand and Plus Jakarta Sans, come from `next/font/google` in
`src/app/layout.tsx`. That module downloads the font files when the app is built and serves them
from this origin under `/_next/static/media/`. Read on frontend `dev` at `2c97769`:

- The compiled stylesheet's `@font-face` rules load `../media/*.woff2` only.
- Nothing under `.next/static` names either Google host. The one server chunk that does is the
  policy string itself.
- Nothing in `src/` or `public/` adds a `<link>` to Google Fonts or an `@import` of it.

So the browser never requested either host, and the two entries allowed requests nothing made.

## Decision

Fonts load only through `next/font`, served from this origin. No directive names a third-party
font or stylesheet host: `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:`, in both
policies. The allowlist test in `src/lib/__tests__/csp.test.ts` loses the two hosts, so adding
either back fails it.

## Options considered

- **Keep the hosts as harmless.** Rejected: an allowed host is somewhere injected CSS can send a
  request, and ADR-0030 rests on that list being short. An entry that nothing uses only widens it.
- **Keep `fonts.gstatic.com` in case `next/font` falls back to it.** Rejected: `next/font` fetches
  at build time from the build machine, where no browser policy applies, and Next's reference
  says "No requests are sent to Google by the browser" (`font.md:13`). What it does when that
  download fails was not tested; whatever it is happens during the build, not in a page.

## Consequences

- What CSS may fetch from is now this origin, `data:`, `blob:` and the configured API origin.
- Adding a third-party font or stylesheet means a new record first. The allowlist test, and the
  exact-list test beside it, fail until the policy and the record agree.
- A third font goes through `next/font` too. `.claude/rules/performance.md` asks for a
  justification for it either way.
- **Revisit** if a font is needed that `next/font` cannot self-host.

## References

- [`../../internal/todos/2026-10-16-todo-csp-drop-font-hosts.md`](../../internal/todos/2026-10-16-todo-csp-drop-font-hosts.md) — the evidence above and the browser runs
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md:13` — `next/font`,
  which downloads Google fonts at build time and self-hosts them
