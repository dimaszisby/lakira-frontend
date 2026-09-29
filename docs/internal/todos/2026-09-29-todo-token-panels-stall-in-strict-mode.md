# Token panels stall on their pending state in development

**Purpose:** fix `/verify-email` and `/invites/accept` never leaving their pending state under
`next dev`, although the backend call succeeds.
**Owner:** hardini
**Branch:** none yet; branch off `dev` when picked up
**Priority:** medium. Development only, by inference (below), but it blocks every manual and
Cypress check of these two flows against a local stack.
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

`next.config.ts` sets `reactStrictMode: true`. Strict Mode unmounts and remounts the component once
in development. `@tanstack/query-core` 5.90.7 `MutationObserver.onUnsubscribe` calls
`this.#currentMutation?.removeObserver(this)` when its last listener leaves, and nothing re-attaches
it on resubscribe. So the first mount calls `mutate`, the fake unmount detaches the observer from
that in-flight mutation, and the remount keeps the same observer, which never hears the result. The
ref, correctly, stops a second `mutate`.

**Inference, not measured:** production does not double-mount, so the observer is never detached
and both pages should render their result. Confirm with a production build before sizing.

## Why no test caught it

Neither panel has a test. A new one would also miss this unless it renders under `<StrictMode>`:
`renderWithProviders` does not add it. The precedent is
`src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`, which wraps
one case in `<StrictMode>` to match `next dev`. Same shape as the `withAuth` lesson of 2026-09-15 in
`.claude/lessons.md`.

## To do

- [ ] Confirm the production behaviour with `next build && next start` against the local stack
- [ ] Integration tests for both panels, including a `<StrictMode>` case; watch it fail first
- [ ] Fix without spending the token twice. Candidates: call the API function directly from the
      effect and keep the result in component state, or read the result through
      `useMutationState` keyed by a mutation key rather than through the observer
- [ ] Check `reset-password`: it submits from a form, not an effect, so it is probably unaffected;
      its success path was not checked live on 2026-09-29
- [ ] Update `docs/internal/todos/2026-08-24-todo-saas-readiness.md` Phase 5b when fixed

## Status

Open.
