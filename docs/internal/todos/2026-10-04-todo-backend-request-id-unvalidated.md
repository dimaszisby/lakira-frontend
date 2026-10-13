# 2026-10-04 - Todo: the backend accepts any `x-request-id` unchecked

**Context:** found while planning `sentry-error-monitoring`. `lakira-backend`'s
`src/shared/middleware/request-id.ts` takes an incoming `x-request-id` header as the request's ID
whenever it is a non-empty string, with no length or format check. This app's proxy forwards
browser headers unchanged (`src/app/api/proxy/[...path]/route.ts`, all but `connection`,
`content-length` and `host`), so a browser can choose the ID that the backend writes on every log
line for that request and tags its Sentry event with.

Read from the code, not tested:

- A caller can put arbitrary text into the backend's logs through that header.
- A caller can reuse another request's ID, so the ID stops identifying one request.
- The frontend now sends this ID to its own Sentry project as the `requestId` tag
  (`src/services/api/normalizeApiError.ts` caps it at 128 characters), so the value is untrusted
  there too.

A second note for the backend from the same work: `@sentry/node` 11 removed `sendDefaultPii`
in favour of `dataCollection`, whose categories default to **on**. The backend is on 10 and its
scrubber's comment relies on the old default. An upgrade needs that block set explicitly.

The fix belongs to the backend (validate or ignore the incoming header) or to this proxy (drop the
header before forwarding). It touches the same boundary as
`docs/internal/todos/2026-10-02-todo-proxy-client-ip-forwarding.md`.

## Checklist

- [ ] Ask the user: raise both notes with the backend on the shared Notion page
- [x] Decide which side fixes the header: backend validation, or the proxy dropping it
- [x] If the proxy drops it, add `x-request-id` to `FORWARDED_HEADER_BLOCKLIST` with a test

## Status

**2026-10-13, register row F-14.** Both sides fix it, independently
(`docs/internal/initiatives/frontend-debt-register/analysis-x-request-id.md`, option D). This
side is done: the proxy no longer forwards `x-request-id`, and `route.test.ts` has a case for the
headers it leaves out, which it did not have before for any of them. The case was seen to fail
against the unchanged route. On a production build against the local stack, a sign-in sent with
`x-request-id: chosen-by-the-browser` came back with an id the backend minted.

Still open:

- The first item. Neither note has been raised on the Notion page; that is register row F-17,
  which the owner has on hold. The backend found the header independently and tracks its own
  check as B-14.
- The line the proxy logs for a backend 5xx carries the backend's id as it arrives. With the
  header dropped that id is the backend's own for browser traffic; nothing here bounds its
  length before logging beyond the logger's 4,096-character cut.
