# 2026-10-14 - Todo: decide whether the CSP keeps inline style

**Context:** debt register row F-21. The page policy keeps `style-src 'unsafe-inline'`
(`src/lib/csp.ts:60`, repeated in `next.config.ts`). The security follow-ups of 2025-11-26 asked
for a plan to remove it (`todo-security-20251126.md`, "TODO – Next Cycle", item 3). The owner
chose, on 2026-10-14, to keep it and record why: removing it costs days and buys little. The
reasons are in [ADR-0030](../../explanation/decisions/adr-0030-inline-style-stays-allowed.md).

## Checklist

- [x] Read what CSS can fetch through, what injected markup can do without inline style, and what
      sets style attributes (recorded in ADR-0030)
- [x] ADR-0030, and its row in the registry
- [x] `csp.test.ts`: a case that fails if a directive CSS fetches through gains a source outside a
      short list; seen to fail with `https:` added to `img-src`, then reverted
- [x] `csp.ts`: the comment above `style-src` names ADR-0030
- [x] `SECURITY.md` and `todo-security-20251126.md` name the decision
- [x] Gates
- [x] Register: F-21 closed; what was found has rows

## Discovered

- [ ] Found: no `<Toaster>` is mounted anywhere under `src/`, so the two `toast()` calls in
      `src/app/(app)/_components/AppShell.tsx` (signing out, and a failed sign-out) show nothing
      -> out of scope; register row F-53.
- [x] Found: the fonts come from `next/font/google`, which downloads them at build time and serves
      them from this origin, so `https://fonts.googleapis.com` in `style-src` and
      `https://fonts.gstatic.com` in `font-src` may be unused. Inference from how `next/font`
      works; no request was observed -> out of scope; register row F-54. Removing them would
      shorten the list ADR-0030 guards. Confirmed and removed 2026-10-16:
      `2026-10-16-todo-csp-drop-font-hosts.md`, ADR-0031.
- [x] Found: `api:spec:check` fails since backend #168 changed the published spec -> out of
      scope; it is register row F-15, whose state now says it is ready.

## Status

Done on `docs/inline-style-stays`, 2026-10-14. Node 24.21.0. The policy is unchanged; the change
is a decision record, a test and a comment.

- The new test passes on the current policy. With `https:` added to `img-src` it failed, together
  with the three existing tests that pin the directive lists; the file was restored and compared
  with `git diff`.
- Gates: lint, css lint, typecheck, format, unit (983, with `coverage:check`) and build pass.
  `api:spec:check` fails, and not because of this branch: backend #168 (`6f686e6`, merged
  2026-10-14T14:23Z) documented the refresh cookie and the analytics 304 in the published spec.
  That sync is register row F-15, now ready; it gets its own PR, as #93 did for backend #163.
  Integration and every Cypress suite were not run: no page, route or data access changed.
