# The server sets the session cookie — Decisions

## D-01 — The proxy sets the session cookie and strips the token from the body

> **Promoted to [ADR-0025](../../../explanation/decisions/adr-0025-the-proxy-sets-the-session-cookie.md)** in the flat
> registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** Four backend operations return an access token in the body. The browser called three
of them through the proxy, read the token in JavaScript and posted it to `/api/auth/session` to be
stored. The security rules say the token never touches JavaScript.

**Decision.** For a successful `POST` to `auth/login`, `auth/register`, `auth/switch-org` or
`auth/refresh`, the proxy reads the token from the backend's response, sets the httpOnly session
cookie on its own response, and removes `token` from the body before the browser receives it.

**Options considered.**

- _A route handler per operation under `/api/auth/`._ Rejected: four files that each re-implement
  forwarding, error passthrough and the refresh-cookie capture the proxy already does, and a fifth
  for the next such endpoint.
- _Keep the client write and harden `/api/auth/session`._ Rejected: the token still crosses
  JavaScript, which is the finding.
- _Server actions for the sign-in forms._ Rejected for this change: it rewrites three forms and
  their tests to fix a transport detail.

**Consequences.** The proxy is not a transparent pipe for these four operations: the body the
browser sees differs from the contract. The list of such operations has to be kept complete, which
a test against the contract does (AC-9). One response now carries the whole session, so the
"signed in without a cookie" and "two organizations at once" states cannot occur.

## D-02 — A success without a usable token fails closed

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** The contract requires `data.token` on all four responses. If it is missing, malformed
or expired, the proxy cannot store a session. For `switch-org` the backend has by then already
issued a refresh cookie for the new organization.

**Decision.** The proxy answers 502, clears both cookies, forwards nothing from the body, and logs
at `error`.

**Options considered.**

- _Forward the response and leave the cookies alone._ Rejected: login would report success with no
  session, the failure fixed on 2026-09-29; after a switch the old access token would sit beside a
  new organization's refresh cookie.
- _Store the refresh cookie and clear only the access token._ Rejected: it relies on the next
  request reaching revive to become consistent. Signed out is consistent now.

**Consequences.** A backend contract break signs the user out. It is reported, because `error`
entries reach the log sink.

## D-03 — `/api/auth/session` is removed entirely

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** With D-01 nothing calls `POST /api/auth/session`. `DELETE` on the same route has had
no caller since logout moved to `/api/auth/logout`.

**Decision.** The route file, `src/features/shared/session.client.ts` and its test are deleted.

**Options considered.**

- _Keep `DELETE` as a local sign-out._ Rejected: an unused endpoint that clears a session is
  surface with no user. `/api/auth/logout` clears the same cookies and revokes upstream.
- _Keep `POST` for the Cypress helper._ Rejected: the helper can sign in the way the app now does.

**Consequences.** Org-switcher D-03 and D-06, which describe storing the token through this route
and where `session.client.ts` lives, describe code that no longer exists. They stay as written;
this entry is the pointer. The route that accepted a token from any caller, and fell back to
structural checks when the backend was unreachable, is gone.

## D-04 — A body that repeats the token is refused

- **Status:** Accepted
- **Date:** 2026-10-05

**Context.** Review pointed out that removing `data.token` forwards any other copy of the token: a
top-level `token`, a sibling key, a message. The contract has none today.

**Decision.** After removing `data.token`, if the token string still occurs anywhere in the body,
the response is treated as carrying no usable token: 502, both cookies cleared (D-02).

**Options considered.**

- _Strip only `data.token` and note the limit._ Rejected: the leak would then return silently the
  day the backend adds a convenience field.
- _Walk the body and delete every key named `token`._ Rejected: it guesses at names, and misses
  `accessToken` or a string that embeds the value. A substring check on the value misses nothing.

**Consequences.** A backend change that duplicates the token breaks sign-in loudly, with an `error`
log line, instead of leaking quietly.
