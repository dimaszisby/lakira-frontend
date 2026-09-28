# ADR-0020 — Changing the active organization reloads the document

- **Status:** Accepted
- **Date:** 2026-09-28
- **Origin:** `D-02` in the org-switcher kit — [`decisions.md`](../../internal/initiatives/org-switcher/decisions.md)

---

## Context

The active organization is the `organizationId` claim on the session token. `src/app/(app)/layout.tsx`
reads it on the server and provides it through `OrganizationProvider`, and every cache key carries
it ([ADR-0015](./adr-0015-cache-keys-are-organization-scoped.md)).

Switching organization is the one moment that id changes inside a browser session. At that
moment the browser still holds the previous organization's data in three places: the TanStack
Query cache, Jotai atoms, and the App Router's client cache of server-rendered payloads. The current
URL may also name a resource that belongs to the previous organization.

Next 16's `useRouter` reference says `router.refresh()` "clears the Client Cache for the current
route" only (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`).
Payloads cached for other routes survive it, which is the same mechanism behind the 2025-11-30
stale-cache incident.

## Decision

After the new session is stored, the app leaves with a full document load of `/dashboard`
(`hardNavigate` in `src/lib/hard-navigate.ts`). Any future change of the active organization does
the same. Tenant changes never use `router.push` or `router.refresh`.

## Options considered

- **`router.refresh()` in place.** Leaves other routes' cached payloads from the previous
  organization, and keeps a URL that may 404 or 403 in the new one.
- **`router.push("/dashboard")` plus clearing each client store.** Correct only while every store
  is remembered. Each client cache added later would be a new way to show one tenant's data in
  another, and nothing would catch the omission.
- **Full document load.** Empties every client cache by construction, including ones that do not
  exist yet, and the server layout re-reads the claim on a fresh request. Costs a reload.

## Consequences

- A switch costs about a second of reload. It is a rare, deliberate action.
- New client-side state needs no switch handling to be tenant-safe.
- The switch mutation cannot be tested on its navigation with the router mock the other tests use;
  `hardNavigate` is its own module so tests can mock it
  (`OrganizationSwitcher.int.test.tsx`).
- If storing the new session fails after the backend switched, the app loads
  `/api/auth/revive?returnUrl=/dashboard` instead, which is also a full load (D-03 in the kit).

## References

- [ADR-0015](./adr-0015-cache-keys-are-organization-scoped.md) — cache keys are organization-scoped
- [`../../internal/incidents/fix-metric-detail-cache-stale-20251130.md`](../../internal/incidents/fix-metric-detail-cache-stale-20251130.md)
- [`../../internal/initiatives/org-switcher/`](../../internal/initiatives/org-switcher/)
