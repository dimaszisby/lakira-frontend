# 2026-10-21 - Todo: the dashboard revalidates on every visit

**Context:** register row F-67, found by the first CI runs of the stack suites (kit
`stack-suites-in-ci`, PR #127). Runs 39514889446 and 39547119660 both failed one case in
`cypress/e2e/stack/metric-to-dashboard.cy.ts`, "drops a deleted value from the dashboard reached
with the back button": after a logged value was deleted, the dashboard reached with the back
button still counted it (`n: 2`, not `n: 1`).

The second run kept its video. It shows the DELETE, the log list's refetch and the back
navigation, then no request at all; the backend's log agrees, with nothing for over 4 seconds.
The dashboard was restored from the router's cache with its query's cached figures, and nothing
refetched them. The query has a 60 s `staleTime`, so a cached entry counts as fresh unless
something has invalidated it.

## What is not known

The exact trigger in CI. Locally, the case has never failed:

- five plain runs, and the full suite in CI's order;
- CI's exact build environment, and `TZ=UTC` for both the server and the browser;
- a 6x CPU throttle in the browser;
- a 6 s delay on the metric chart's requests;
- the `/dashboard` prefetch held back.

Ruled out:

- **the backend's dashboard cache:** a log write awaits its `vizdash:` invalidation before
  answering;
- **a prefetch overwriting the query:** the dashboard's prefetch carries no figures;
- **the serial invalidations in `onSettled`:** the metric chart query is not active on the logs
  tab, so the dashboard is marked stale right after the list refetch. A `Promise.all` version was
  written, tested at unit level and not shipped, because it does not explain this;
- **the proxy:** the Next log has no error;
- **a second QueryClient:** there is one, in `src/app/providers.tsx`.

## Decision

The owner chose to make the dashboard independent of the trigger rather than keep searching:
`useDashboardVisualizations` sets `refetchOnMount: "always"`, so every visit revalidates, back
navigation included. The cached figures show at once and are corrected when the response
arrives.

Cost: one request per visit. It is usually a 304. On a back navigation the app's `etagCache`
sends `If-None-Match`; on a fresh load the browser revalidates with its own cached ETag, since the
response carries `Cache-Control: private, no-cache`. Measured locally on the fixed build: 304 on
the fresh load, 200 after the delete.

## Checklist

- [x] `src/features/data-visualizations/hooks.ts`: `refetchOnMount: "always"` on the dashboard
      query, with the reason.
- [x] `src/features/data-visualizations/__tests__/dashboard-revalidates-on-visit.test.tsx`: fresh
      cached figures are refetched on mount.
- [x] Seen to fail: without the option, the case fails with 0 calls; with it, 1.
- [x] `cypress/e2e/stack/metric-to-dashboard.cy.ts`: the comment above the case says revalidation,
      not the invalidation alone, corrects the figures. The assertions are unchanged.
- [x] In a browser, production build, local stack: a temporary copy of the spec logged the
      dashboard requests (deleted). The fresh load revalidated (304), and after the delete and the
      back navigation the dashboard was refetched (200) and read `n: 1`.
- [x] Register: F-67 filed and closed.
- [x] Gates

## Status

Fixed 2026-10-21 on `fix/dashboard-revalidate-on-visit`. Whether it turns CI green is checked
where the failure was found: kit `stack-suites-in-ci`, checklist § Discovered, on PR #127's next
run once its branch is updated from `dev`. If that run is still red, the cause sits below the
query's mount.
