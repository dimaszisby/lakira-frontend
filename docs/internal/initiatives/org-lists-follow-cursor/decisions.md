# Org lists follow the cursor — Decisions

## D-01 — Fetch every page under the existing key, and stop on a repeated cursor

- **Status:** Accepted
- **Date:** 2026-10-24

**Context.** Register row F-76. Since lakira-backend #218 (its kit `api-tooling-residuals`, D-09),
`GET /organizations` and `GET /organizations/{id}/members` answer at most 100 rows and a
`nextCursor`, null on the last page. `listMembers` and `listMyOrganizations` in
`src/features/organizations/api.ts` read the first page only, so a 101st member or organization
was silently missing from `MemberList` and `OrganizationSwitcher`. The backend's Notion Part 2
record "The organization lists page by cursor, 100 rows per page" asks the frontend to follow the
cursor. In review of #218 the backend found a cursor that repeated the same row forever.

**Decision.** The owner chose on 2026-10-24 to fetch every page with no change to the interface.

- Both functions follow `nextCursor` until it is null or absent, through one local helper,
  `collectPages`, and return the merged list in the shape they returned before.
- The hooks, the cache keys, `invalidateMembers` and both components are unchanged.
- `after` is sent through `buildQueryString`; `limit` is not sent, so the backend's default of
  100 applies.
- A cursor the loop has already followed ends it, with the rows collected so far and a
  `console.warn` outside production. A backend that repeats a cursor cannot loop the browser.
- `withApiErrorHandling` wraps the whole loop, so a failure or a cancellation on any page is
  handled as one on the first page was.

**Options considered.**

- _A cursor-infinite query with a Load more control on the members list:_ rejected. There is no
  paging UI to extend, a membership list rarely passes 100, and the change would add a hook, a key
  and a control to keep accessible.
- _Throwing on a repeated cursor:_ rejected. The list would show an error for rows it already has.
- _A shared helper in `src/features/shared/`:_ not yet. Both callers are in this file; the third
  caller moves it.

**Consequences.** A list of n rows costs ceil(n / 100) serial requests before it renders, and
the whole list is refetched on every invalidation. A cursor repeated by the backend drops the
rows after it, with only a development warning to show for it.
