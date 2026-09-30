# Token panels stall on their pending state in development

**Purpose:** fix `/verify-email` and `/invites/accept` never leaving their pending state under
`next dev`, although the backend call succeeds.
**Owner:** hardini
**Branch:** `fix/token-panels-stall-in-strict-mode` off `dev`
**Priority:** medium. Seen in development; production has triggers too (below). It blocks every
manual and Cypress check of these two flows against a local stack.
**Found:** 2026-09-29, during the org-switcher live check (AC-5), kit
`docs/internal/initiatives/org-switcher/`.

## What happens

Opening the emailed link, signed in, against a local backend with Mailpit:

| Page                      | Request in the browser                  | Backend result                      | Page shows, 5 s later        |
| ------------------------- | --------------------------------------- | ----------------------------------- | ---------------------------- |
| `/invites/accept?token=…` | not captured (tracking started later)   | membership created (`joinedAt` set) | "Accepting your invitation…" |
| `/verify-email?token=…`   | `POST /api/proxy/auth/verify-email` 200 | `emailVerifiedAt` set               | "Verifying your email…"      |

The token is spent, so a reload shows the failure state for a request that succeeded.

## Cause

Both panels, `src/features/organizations/components/AcceptInvitePanel.tsx` and
`src/features/auth/components/VerifyEmailPanel.tsx`, call `mutate(token)` from an effect guarded by
a `useRef(false)`, so the single-use token is spent once under Strict Mode's double mount.

`@tanstack/query-core` 5.90.7 `MutationObserver.onUnsubscribe` calls
`this.#currentMutation?.removeObserver(this)` when its last listener leaves, and nothing reattaches
it on resubscribe. `next.config.ts` sets `reactStrictMode: true`, and Strict Mode runs an extra
unsubscribe and resubscribe in development. So the first mount calls `mutate`, the extra cycle
detaches the observer from that in-flight mutation, and the observer never hears the result. The
ref, correctly, stops a second `mutate`.

Fixed upstream in TanStack/query#11172, released in 5.102.0: `onSubscribe` now reattaches the
observer. The PR names the production triggers as well: `<Activity mode="hidden">` and boundaries
that suspend again. This app does not enable `cacheComponents`, so Next does not hide routes with
`Activity` here, and no page is known to hit the other trigger. So "development only" holds for
today's pages, but it is not a property of the bug.

## Why no test caught it

Neither panel had a test. And a `<StrictMode>` nested inside `renderWithProviders` would not have
caught it either: measured on 2026-09-29 with a trace of observer calls, it doubles renders but
runs no extra effect or subscription cycle. Only the root-level wrapper does, which RTL provides as
`render(ui, { reactStrictMode: true })`, now stated in `.claude/rules/testing.md`. Same shape as the
`withAuth` lesson of 2026-09-15 in `.claude/lessons.md`: the first version of the new tests passed
against the broken version.

## To do

- [x] Integration tests for both panels, rendered with `reactStrictMode: true`:
      `VerifyEmailPanel.int.test.tsx` and `AcceptInvitePanel.int.test.tsx`, 4 cases each. On
      5.90.7, 6 of 8 fail (every case that waits for a result); on 5.104.0, all 8 pass
- [x] Fix: `@tanstack/react-query` raised to `^5.104.0`, lockfile 5.90.7 to 5.104.0, no component
      change. Decision: [ADR-0021](../../explanation/decisions/adr-0021-tanstack-query-floor-at-the-observer-reattach-fix.md)
- [x] ~~Confirm the production behaviour with a production build~~: no longer needed, the fix
      removes the cause in both modes
- [x] Live, 2026-09-29, on a separate `next dev` (port 3001, scratch worktree, 5.104.0) against the
      local backend with Mailpit, fresh tokens for a new user: verify-email shows "Email verified",
      invite accept shows "You're in", each after one `POST` returning 200
- [x] `reset-password`: shows "Password updated" after `POST /api/proxy/auth/reset-password` 200;
      the new password signs in (200) and the old one is refused (401)
- [x] `docs/internal/todos/2026-08-24-todo-saas-readiness.md` Phase 5b updated, and
      `docs/internal/audits/saas-readiness/iteration-plan.md` rows 5 and 6 set to Done

## Discovered

- [x] Found: `src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
      ("shows the saved priority as selected when the form opens") nests `<StrictMode>` inside
      `renderWithProviders`, and its comment says it reproduces the double effect run. By the
      measurement above it runs no extra effect cycle, so it may not guard what it claims → out of
      scope; check it by breaking the fix it guards and switching it to `reactStrictMode: true`.
      Checked 2026-09-30 on `fix/metric-settings-strict-mode-test`. The fix it guards is
      Modal's `createPortal` (b5b1ebb). With Ariakit's portal restored, the case failed nested
      and with the option, and passed with no Strict Mode. So it did guard the fix; its
      comment named the wrong mechanism. Switched to `reactStrictMode: true` anyway, to match the wrapper
      `next.config.ts` applies and `testing.md`; comment rewritten; `testing.md` clarified.

## Status

Done 2026-09-29 on `fix/token-panels-stall-in-strict-mode`. ADR-0021 accepted on merge (#59).
The discovered item was closed 2026-09-30 on `fix/metric-settings-strict-mode-test`.
