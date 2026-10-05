# 2026-10-04 - Todo: the API proxy forwards outside its API base

**Context:** finding N1 (P1) of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md). `src/app/api/proxy/[...path]/route.ts`
joins the path segments into a URL and lets `new URL()` normalise it, so a segment that decodes to
`../../x` leaves `/api/v1`. Reproduced: `GET /api/proxy/..%2f..%2fhealth` with any cookie value
reached the backend's `/health`. The token check tests only that a cookie is present.

**Size when picked up:** single commit, unless the fix changes what the proxy accepts for a
legitimate path, which is a routing boundary and needs an ADR.

## Checklist

- [x] Reject a segment that contains `/` or a backslash, or equals `.` or `..`
- [x] Assert the built URL's pathname still starts with the API base's pathname
- [x] Unit tests for both in `src/app/api/proxy/[...path]/__tests__/route.test.ts`, each watched
      failing against the unfixed handler
- [x] Re-run the probe from section 2.2 of the audit against a production build

## Status

Done 2026-10-05 on `fix/proxy-path-escapes-api-base`. No ADR: every path the client sends and all
33 in the contract are fixed words and ids, so nothing legitimate is refused or changed.

`buildUpstreamUrl` in `src/lib/auth-paths.ts` now builds the upstream URL. It refuses a segment
that is empty, `.`, `..`, or contains a slash or a backslash; percent-encodes the rest, so a
decoded `?`, `#` or `%2e%2e` stays inside one path component; and checks the result against the
base. The proxy answers 400 `{ "error": "Invalid path" }` before the session check and forwards
nothing. The rule is in `.claude/rules/security.md` § The proxy denies by default.

- Tests watched failing first: nine of the ten first route tests failed against the unfixed
  handler; the tenth pins that an ordinary path and query are forwarded as before.
- Mutations, each caught: every segment accepted (11 tests fail), no encoding (8), no handling of
  an unencodable segment (1), the check moved after the session check (1). With the segment rules
  and the encoding both removed, the base check alone still refused all four traversal cases.
- Production build, backend on `:8001`: ten traversal variants, none left `/api/v1`. The audit's
  `..%2f..%2fhealth` answers 400. A missing cookie still answers 401 and a wrong password still
  gets the backend's own 401.
- Reviewed by the `code-reviewer` agent, narrow brief. It found no way out of the base. It found
  that a lone surrogate made `encodeURIComponent` throw, giving a 500; now a 400, with a test.

The first box, as written, said only to reject bad segments. Encoding the rest was added because
rejection alone leaves `?` and `#` re-interpreted.
