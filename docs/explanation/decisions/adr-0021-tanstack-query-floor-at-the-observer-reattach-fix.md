# ADR-0021 — TanStack Query's floor is the release that reattaches mutation observers

- **Status:** Proposed
- **Date:** 2026-09-29
- **Origin:** todo — [`2026-09-29-todo-token-panels-stall-in-strict-mode.md`](../../internal/todos/2026-09-29-todo-token-panels-stall-in-strict-mode.md)

---

## Context

`/verify-email` and `/invites/accept` stayed on their pending message under `next dev`, although
the backend call succeeded: B's address was verified and the membership was created. Found during
the org-switcher live check on 2026-09-29.

Both pages call `mutate(token)` from an effect. In `@tanstack/query-core` 5.90.7,
`MutationObserver.onUnsubscribe` detaches the observer from its running mutation when its last
listener leaves, and nothing reattaches it when a listener subscribes again. React runs exactly
that unsubscribe and resubscribe on a component that keeps its state: Strict Mode's extra effect
cycle in development, and `<Activity mode="hidden">` or a boundary that suspends again in
production. The mutation still settles in the cache, but the observer never hears it, so
`isPending` stays `true` for good.

Upstream fixed it in TanStack/query#11172 ("reattach 'MutationObserver' to its mutation in
'onSubscribe'", fixing #11171), first released in 5.102.0 on 2026-08-22. Measured here: 5.90.7's
`mutationObserver.js` has no `onSubscribe`, and 5.102.0's has one that re-adds the observer and
refreshes its result.

The repository's range was `^5.80.5`, which already admits the fix; the lockfile held 5.90.7.

## Decision

Raise `@tanstack/react-query` to `^5.104.0`, the current release, so the lockfile and the range's
floor both sit above the fix. `@tanstack/query-core` follows as its dependency.

## Options considered

- **Lockfile only, range left at `^5.80.5`.** Rejected: the range would still admit a broken
  version, so a lockfile regenerated under an older constraint, or a downgrade, could bring the
  stall back with nothing to say it matters.
- **Work around it in the two pages.** Call the API once from the effect and keep the result in
  component state instead of reading it from the observer. Rejected: it patches two call sites of
  a library bug that is fixed upstream, and any other mutation started from an effect, or running
  while its component is hidden or re-suspended, stays exposed.
- **Pin exactly `5.102.0`.** Rejected: the minimum that contains the fix is what matters, and an
  exact pin blocks every later patch for no benefit.

## Consequences

- Both pages render their result under `next dev`. Checked by
  `VerifyEmailPanel.int.test.tsx` and `AcceptInvitePanel.int.test.tsx`: six of their eight cases
  fail on 5.90.7 and all pass on 5.104.0.
- **Those tests must render with `reactStrictMode: true`**, not a `<StrictMode>` nested inside
  `renderWithProviders`. A nested one doubles renders but not effects, so it cannot reproduce this;
  measured with a subscribe and effect trace on 2026-09-29.
- The fix covers every `useMutation` in the app, including the production triggers
  (`Activity`, re-suspending boundaries) that no page here is known to hit today.
- The upgrade spans 5.90.7 to 5.104.0 within one major. The gates, integration included, are the
  check that nothing else moved.

## References

- TanStack/query#11172, #11171
- [`.claude/rules/testing.md`](../../../.claude/rules/testing.md) — Strict Mode in tests
