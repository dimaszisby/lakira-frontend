# 2026-10-04 - Todo: `SECURITY.md` lists a known issue that was fixed

**Context:** found while updating `SECURITY.md` for `sentry-error-monitoring`. Its "already known
and tracked" list still says `middleware.ts` performs a presence-only session-cookie check and
does not validate token expiry. The gate is `src/proxy.ts` and has validated the `exp` claim since
2026-09-12 (`.claude/rules/security.md` § Auth and session). The monitoring entry in the same list
was corrected in that branch; the rest of the list was not reviewed.

## Checklist

- [ ] Check every entry in `SECURITY.md`'s known-items list against the code
- [ ] Remove or reword the ones that no longer hold

## Status
