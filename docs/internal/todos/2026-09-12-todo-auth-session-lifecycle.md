# Auth session lifecycle

**Purpose:** fix the three session bugs carried over from the UI refactor — logout that never logs out, `/login` redirecting on an unusable cookie, and sessions ending 15 minutes after login.
**Owner:** hardini
**Branch:** `fix/auth-session-lifecycle` off `dev`

Diagnoses came from "Follow-ups, not done here" in
[`2026-09-11-todo-ui-components-refactor.md`](./2026-09-11-todo-ui-components-refactor.md). All three
were verified against the code and the live backend before anything was changed.

## 1. Log Out never cleared the session

- [x] `Sidebar` used its own inline `useMutation` posting to `/api/proxy/auth/logout`. The feature
      hook `useLogoutUserMutation` already existed and already cleared the cookie; the sidebar just
      did not use it. It now does.
- [x] `logoutUser` posts to `/api/auth/logout` instead of through the proxy. The proxy strips
      `Set-Cookie`, so the route that deletes the cookies was never reached.
- [x] `/api/auth/logout` revokes upstream **and** clears both cookies. The refresh cookie is scoped
      to `/api`, so it reaches this route — and it is the only credential the backend can use to find
      the token family to revoke.
- [x] An unreachable backend no longer blocks the local clear.

## 2. `/login` and `/register` redirected on presence, not usability

- [x] Both pages now test `isSessionTokenUsable`, the same check the gate makes.

Combined with (1) this was a trap with no exit from inside the app: the cookie could not be cleared,
and the login form could not be reached.

## 3. Sessions died about 15 minutes after login

Root cause, and it was not where the note guessed: **`/api/auth/login/route.ts` was dead code.** It
held the only call to `captureRefreshCookie`, and nothing imported it. Login actually runs
`POST /api/proxy/auth/login` from the browser, and the proxy deleted the backend's `Set-Cookie`
wholesale — so `lakira_refresh` never existed on this origin and the proxy's own 401 retry had
nothing to redeem.

- [x] The proxy captures `lakira_refresh` from the upstream response and re-issues it scoped to
      `/api` on this origin.
- [x] Deleted `src/app/api/auth/login/route.ts`. A second, unreachable login implementation is the
      hazard, not the asset.
- [x] A 401 that refresh cannot rescue clears both cookies.
- [x] `/api/auth/session` DELETE clears both cookies, not just the access token.

### Refresh had to be coalesced first

Not in the original diagnosis, and a prerequisite rather than an extra. `RotateRefreshToken` revokes
the **entire token family** when an already-redeemed refresh token is presented again. A page fires
several queries at once; when the access token expires they 401 together and every redemption after
the first reads as replay. Fixing the capture without this would have logged users out _because_
refresh finally worked.

- [x] `refreshAccessToken` shares one round trip between concurrent callers, and replays the result
      for 30 s afterwards for requests that left the browser before the rotated cookie arrived.
- [x] Per-process only; instances behind a load balancer can still collide. Documented, not closed.

### The gate was not running at all

Found while verifying the navigation path. `middleware.ts` sat at the repository root while `app` is
at `src/app`, and Next 16 renamed the convention to `proxy`. Next never loaded it. It failed
silently, because `src/app/(app)/layout.tsx` also redirects — but that fallback has no `returnUrl`
and runs after rendering starts. Proved with a marker header that never appeared in a response.

- [x] `middleware.ts` → `src/proxy.ts`, exporting `proxy`.
- [x] The matcher-sync test reads the new path, so a move back fails the suite.

### Navigation could not refresh either

The refresh cookie is scoped to `/api` on purpose, so a page navigation does not carry it and the
gate cannot read it. Bouncing an expired token to `/login` ended the session however healthy its
30-day refresh token was.

- [x] `src/app/api/auth/revive/route.ts`: the gate redirects an expired token there, it redeems,
      writes both cookies and continues to `returnUrl`; on failure it clears both and falls to
      `/login`. A revived token that is itself unusable counts as failure, which is what terminates
      the redirect.
- [x] Widening the cookie to `/` was rejected: `getServerAuthHeaders()` forwards every cookie, so a
      server component would rotate during SSR and discard the new value into an internal fetch,
      leaving the browser holding a superseded token the backend reads as replay.

## Verification

| Gate                      | Result                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `lint`                    | 0 errors, 21 warnings — the `dev` baseline, none in touched files                                 |
| `lint:css`                | clean                                                                                             |
| `typecheck`               | clean                                                                                             |
| `test:unit`               | 76 suites, 638 tests (`dev`: 71 / 593)                                                            |
| `test:integration`        | 17 suites, 82 tests (`dev`: 17 / 80)                                                              |
| `coverage:check --strict` | all folder goals met; global 32.88 / 37.22 / 30.58 / 32.21 (`dev`: 30.88 / 35.78 / 29.98 / 30.10) |
| `build`                   | passes, and now reports `ƒ Proxy (Middleware)`                                                    |

Checked in the browser against the local backend:

- The trapped session in the tab was cleared by the new 401 handling — `proxy.session.cleared`.
- No cookie → `/login?returnUrl=%2Fmetrics%2Fabc`. The `returnUrl` is new; the layout fallback that
  had been standing in for the gate could not carry one.
- Expired token → `/api/auth/revive?returnUrl=%2Fmetrics%2Fabc%3Ftab%3Dlogs`.
- Revive with an unusable refresh token → `/login?returnUrl=…`, both cookies cleared, `no-store`.
- `returnUrl=https://evil.test/phish` → `/login`.

## Status

**2026-09-12: complete.** All four behaviours confirmed against the live backend after a real login.

- **Refresh cookie lands.** `/api/auth/revive` redeemed the cookie the browser was holding and
  logged `auth.revive.succeeded`, then continued to `/metrics?tab=list` (200). Before the change the
  cookie did not exist on this origin at all.
- **Rotation persists.** Three consecutive revivals succeeded, the last past the 30 s coalescing
  window — so it was a genuine redemption of a rotated token, not a replayed result. A dropped
  rotation would have presented a superseded token and revoked the family.
- **Log Out ends the session.** `POST /api/auth/logout` 200, landed on `/login` and *stayed* there.
  `/dashboard` now redirects, and a revival attempt afterwards logs `auth.revive.failed` — nothing
  left to revive.
- **The gate runs.** `GET /dashboard 200 … proxy.ts: 4ms`, and `build` reports `ƒ Proxy
  (Middleware)`.

## Follow-ups, not done here

- **A `Set-Cookie` written during SSR is discarded.** The proxy's cookie clear and rotation only
  reach the browser from a client-side call; on a server-rendered prefetch the header goes to an
  internal fetch. It self-heals on the next client call, and it is why the first clear during
  verification appeared not to work. The same mechanism is the reason the refresh cookie stays
  scoped to `/api`.
- **Registration gets no refresh cookie.** The backend's `/auth/register` never calls
  `setRefreshCookie` — only `/auth/login` and `/auth/refresh` do. A newly registered user's session
  therefore still ends when the access token expires, and the revive route will fall through to
  `/login`. A backend change, raised here because it looks like a frontend bug.
- `src/hooks/useAuth.ts` is dead code and imports `useRouter` from `next/router`, which the App
  Router does not have. It would not run if anything called it.
