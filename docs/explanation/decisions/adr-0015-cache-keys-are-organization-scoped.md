# ADR-0015 — Cache keys are organization-scoped

- **Status:** Accepted
- **Date:** 2026-08-29
- **Origin:** `ADR-004` in the SaaS-readiness kit — [`decisions.md`](../../internal/audits/saas-readiness/decisions.md)

---

## Context

The backend is multi-tenant: every domain table carries an `organizationId`, and the access
token names the organization the session is acting for. The frontend's TanStack Query cache keys
carried no tenant dimension, so a user belonging to two organizations would be served one
organization's cached payload while acting as the other.

This is not a hypothetical failure mode. `lakira-backend` shipped the same defect and patched it
same-day as findings N1/N2 on 2026-06-05, where its Redis visualization keys were scoped by
`userId` alone and a dual-membership user could read another organization's data from cache.

The frontend cache makes it more likely, not less: the `QueryClient` is created once per browser
session and survives every client-side navigation, so a soft organization switch keeps the whole
previous tenant's cache in memory.

## Decision

1. **Every cache key carries the organization id**, except `authKeys` — the profile is a
   property of the user, identical whichever organization the session acts for.
2. **The id sits at index 1**, immediately after the resource root: `["metrics", orgId, …]`.
3. **Key factories take `organizationId` as a required first argument**, so a missed call site
   is a compile error rather than a silent leak.
4. **The org dimension reaches every factory in a single change.** Partial adoption is worse
   than none: some features would isolate tenants and others would not, with nothing
   distinguishing them.
5. **The id is read server-side** from the session token's `organizationId` claim, in
   `src/app/(app)/layout.tsx`, and provided by `OrganizationProvider`.
6. **Every factory carries a test** asserting its keys differ across organizations.

## Options considered

- **Organization id at index 0** (`[orgId, "metrics", …]`). Rejected. Isolation comes from the
  id being present at all, not from its position — two organizations produce different arrays
  either way. What position decides is invalidation correctness, and
  `data-visualizations/cache.ts` matches by array position: index 0 would have made its
  predicate match nothing, so cross-organization visualization data would silently never
  invalidate.
- **Organization id at the tail.** Rejected outright. Every prefix invalidation would keep
  matching across organizations, which is the failure this ADR exists to prevent.
- **Reading the id from `userAtom`.** Rejected. The atom is populated client-side after a
  profile fetch, so it is `null` on every hard load. Keys would be built with `undefined` on
  first paint and re-keyed once the profile landed, briefly caching data under a key that does
  not identify its tenant. Gating every query on `enabled: false` until the organization is
  known would add a loading state to every screen.
- **Clearing the whole cache on organization switch.** Rejected as the primary mechanism. It
  depends on remembering to call it at every switch point, and a missed call is silent. Scoped
  keys are correct by construction. Clearing remains a reasonable belt-and-braces addition.

## Consequences

- Every `cache.ts` invalidation helper takes the organization id. That is deliberate: it makes
  the dependency explicit rather than incidentally correct.
- Adding a key factory without the organization id will not compile, provided it follows the
  required-first-argument shape.
- `src/features/__tests__/key-tenant-scoping.test.ts` must gain a row for every new key-builder
  method. It is the only guard — the integration suites mock the API layer and never seed a
  cache key, so they cannot catch a regression here.
- `data-visualizations/cache.ts` remains positionally coupled to the key shape. Its own test
  file pins the offsets; change the two together.
- Server components cannot use React context, so anything prefetching an organization-scoped
  query uses `getServerOrganizationId()` from `src/services/api/serverHeaders.ts`.

## Links

- `src/features/organizations/context.tsx`
- `src/features/__tests__/key-tenant-scoping.test.ts`
- `docs/internal/audits/saas-readiness/audit-2026-08-29.md` section 5
- `lakira-backend` findings N1/N2, `audit-2026-06-05.md`
