# 2026-10-04 - Todo: the API proxy forwards outside its API base

**Context:** finding N1 (P1) of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md). `src/app/api/proxy/[...path]/route.ts`
joins the path segments into a URL and lets `new URL()` normalise it, so a segment that decodes to
`../../x` leaves `/api/v1`. Reproduced: `GET /api/proxy/..%2f..%2fhealth` with any cookie value
reached the backend's `/health`. The token check tests only that a cookie is present.

**Size when picked up:** single commit, unless the fix changes what the proxy accepts for a
legitimate path, which is a routing boundary and needs an ADR.

## Checklist

- [ ] Reject a segment that contains `/` or a backslash, or equals `.` or `..`
- [ ] Assert the built URL's pathname still starts with the API base's pathname
- [ ] Unit tests for both in `src/app/api/proxy/[...path]/__tests__/route.test.ts`, each watched
      failing against the unfixed handler
- [ ] Re-run the probe from section 2.2 of the audit against a production build

## Status
