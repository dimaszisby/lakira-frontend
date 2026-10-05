# 2026-10-04 - Todo: `SECURITY.md` lists a known issue that was fixed

**Context:** found while updating `SECURITY.md` for `sentry-error-monitoring`. Its "already known
and tracked" list still says `middleware.ts` performs a presence-only session-cookie check and
does not validate token expiry. The gate is `src/proxy.ts` and has validated the `exp` claim since
2026-09-12 (`.claude/rules/security.md` § Auth and session). The monitoring entry in the same list
was corrected in that branch; the rest of the list was not reviewed.

## Checklist

- [x] Check every entry in `SECURITY.md`'s known-items list against the code
- [x] Remove or reword the ones that no longer hold

## Status

Done 2026-10-04 on `docs/saas-reaudit-2026-10-04`. Five entries, checked against `dev` at `07df6c9`:

- Error monitoring: holds. Kept.
- `middleware.ts` presence-only check: fixed 2026-09-12. `src/proxy.ts` tests the `exp` claim, and
  a request with a malformed cookie was redirected to `/api/auth/revive` on a production build.
  Removed.
- Opt-in proxy allowlist: fixed. `GET /api/proxy/analytics/summary` without a cookie answered 401.
  Removed.
- Unvalidated `/api/auth/session`: fixed. A malformed token answered 400. Removed.
- No environment validation: fixed, `src/lib/env.ts`. Removed.

Four entries were added from the 2026-10-04 audit (N1, N3, N4, N6), so the list again says what is
known and open.
