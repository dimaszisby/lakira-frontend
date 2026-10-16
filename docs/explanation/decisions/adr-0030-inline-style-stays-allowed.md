# ADR-0030 — Inline style stays allowed; what CSS may fetch is what is guarded

- **Status:** Accepted
- **Date:** 2026-10-14
- **Origin:** debt register row F-21 — [`2026-10-14-todo-inline-style-stays.md`](../../internal/todos/2026-10-14-todo-inline-style-stays.md)
- **Related:** [ADR-0026](./adr-0026-script-runs-by-nonce.md), which made script nonce-only and left this exposure recorded; [ADR-0031](./adr-0031-fonts-are-self-hosted.md), which removes the two Google Fonts hosts from the list below

---

## Context

The page policy built by `src/lib/csp.ts` keeps
`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, and the static policy in
`next.config.ts` repeats it. ADR-0026 removed `'unsafe-inline'` from `script-src` and recorded the
style half as a narrower exposure. The security follow-ups of 2025-11-26
(`docs/internal/todos/todo-security-20251126.md`, "TODO – Next Cycle", item 3) asked for a plan to
remove it, which became register row F-21.

Read on frontend `dev` at `be6b88d`:

- **Nothing waits on it.** The 2026-10-10 readiness audit grades "CSP and security headers" Pass,
  with this exposure stated (`docs/internal/audits/saas-readiness/audit-2026-10-10.md:248`).
- **Inline CSS can leak data only by fetching something.** A selector that matches a secret then
  loads a URL; a font or image request carries it out. What CSS may fetch is decided by
  `img-src 'self' data: blob:`, `font-src 'self' https://fonts.gstatic.com data:`,
  `connect-src 'self'` plus the API origin, and `style-src`'s own host list. None of them reaches a
  host an attacker controls. Script, which could do anything, already runs only by nonce.
- **Injected markup can style itself without inline style.** The compiled stylesheet carries
  Tailwind utilities the app uses, `fixed`, `inset-0`, `z-50` and `h-screen` among them, which are
  enough to draw an element over the whole page with classes alone.
- **Style attributes cannot carry a nonce.** A nonce or hash allows a `<style>` element, never a
  `style` attribute. Under `style-src 'self' 'nonce-…'` the browser ignores every style attribute
  in server-rendered HTML, and React does not set them again when it hydrates. The app has 13
  `style={…}` sites in 8 files, which set chart height, the colours users pick for categories,
  slider positions and colour swatches. Ariakit and framer-motion also render style attributes on
  the server.

## Decision

`style-src` keeps `'unsafe-inline'`, in both policies. What is guarded instead is the list of
places CSS may fetch from: `src/lib/__tests__/csp.test.ts` fails if `default-src`, `style-src`,
`img-src`, `font-src` or `connect-src` gains any source outside `'self'`, `data:`, `blob:`, the two
Google Fonts hosts and the configured API origin. A wildcard, a bare scheme such as `https:`, or a
new host fails it.

## Options considered

- **Remove `'unsafe-inline'` entirely.** Every `style={…}` moves to a class, or to a CSS variable
  set after mount, which shows unstyled until hydration. The style attributes Ariakit and
  framer-motion render on the server need workarounds or patches. Rejected: two to five days and a
  risk of visual regressions, for little gain while markup can style itself with classes.
- **Split the directive.** `style-src-elem 'self' 'nonce-…'` blocks an injected `<style>` element,
  and `style-src-attr 'unsafe-inline'` keeps attributes working. Rejected: an injected element
  with classes or a style attribute achieves the same as an injected `<style>`, so the gain is
  close to none. It would also need goober, which react-hot-toast uses for its CSS, to receive the
  nonce through `window.__nonce__`.
- **Hashes.** Rejected: like a nonce, a hash allows `<style>` elements and never attributes.

## Consequences

- Injected markup can still change how a page looks. Running script, sending data to another
  origin, and loading a third-party resource remain blocked.
- A change that adds a host or a wildcard to a directive CSS fetches through fails a unit test and
  has to be argued here first. Adding a third-party stylesheet or font is that kind of change.
- `SECURITY.md` keeps listing inline style as a known item, now naming this record.
- **Revisit** if any of these changes: a directive above needs a third-party host or a wildcard;
  the app stops setting dynamic values through style attributes; or browsers gain a way to allow a
  style attribute by nonce.

## References

- [`../../internal/todos/2026-10-14-todo-inline-style-stays.md`](../../internal/todos/2026-10-14-todo-inline-style-stays.md) — the evidence above, and what was found on the way
- [`../../internal/audits/saas-readiness/audit-2026-10-10.md`](../../internal/audits/saas-readiness/audit-2026-10-10.md) — "CSP and security headers"
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` — Next's guide, whose
  production example uses a style nonce and says nothing of style attributes
