# Proxy error-body allowlist — Checklist

Register row F-20. The proxy forwarded backend error bodies verbatim. The owner chose an allowlist
(O-06, [D-01](decisions.md), promoted to ADR-0034).

## Code

- [x] `src/lib/read-capped.ts`: `readCapped` and `discard`, moved verbatim from
      `src/lib/telemetry-intake.ts`, typed to take a `Request` or a `Response`
- [x] `src/lib/telemetry-intake.ts`: imports them; behaviour unchanged
- [x] `src/lib/proxy-error-body.ts`: `MAX_ERROR_BODY_BYTES` (64 KiB) and `filterErrorBody`. It keeps
      `status`, `message`, `error` and `code` as strings, `errors` as strings or
      `{ field?, message }`, and `issues` as `{ message }`. It returns `null` for anything but a
      JSON object
- [x] `src/app/api/proxy/[...path]/route.ts`: on a status of 400 or above, and not the 401 that
      ends a session, the body is read capped and filtered, or dropped with
      `proxy.error_body_dropped`. `isSessionEnded` is decided once, before the read

## Tests

- [x] `src/lib/__tests__/proxy-error-body.test.ts`:
  - `stack` and unknown keys are dropped;
  - field issues and Zod issues are reduced;
  - non-string values are dropped;
  - an object with nothing to keep becomes `{}`;
  - seven bodies that are not a JSON object return `null`;
  - for five envelope shapes, `normalizeApiError` reads the same `messages`, `serverCode` and
    `hasServerMessage` from the filtered body as from the original.
- [x] `src/lib/__tests__/read-capped.test.ts`: a `Response` within the cap, over it while
      streaming, over it by declared length, and with no body
- [x] `src/app/api/proxy/[...path]/__tests__/route.test.ts`, "an upstream error body":
  - a 400 arrives filtered, as JSON;
  - a 500 loses its `stack` and keeps `x-request-id`;
  - an HTML 502 arrives empty and logs `not_json`, without its content;
  - an oversized body arrives empty and logs `too_large`;
  - an empty 404 logs nothing;
  - a 200 is untouched;
  - the session-ending 401 still answers `SESSION_EXPIRED`.

  AC-7's case is renamed to "filtered".

## Docs and rules

- [x] ADR-0034 and its registry row; D-01 carries the promotion banner
- [x] `.claude/rules/security.md` § The proxy denies by default: the allowlist, and how to add a
      key
- [x] `.claude/rules/data-access.md` § The proxy: one paragraph
- [x] `docs/reference/routes-and-proxy.md`: step 8, and step 4's exception
- [x] Register:
  - F-20 closed;
  - O-06 removed;
  - "As of" at `90df66d`;
  - the register README's status line updated.
- [x] Todo `2026-09-20-todo-proxy-forwards-upstream-error-bodies.md`: both boxes ticked, a Status
      section added
- [x] `docs/internal/initiatives/mobile-sign-out/README.md`: status "Done 2026-10-21 (#130)",
      left over from that merge

## Discovered

- [x] Found: `/api/auth/logout` and `/api/auth/revive` might also forward backend bodies →
      checked, they do not. Both answer with their own JSON or a redirect, so nothing to change
- [x] Found: notes for the backend about the allowlist → out of scope. The Part 1 note on the
      Notion page "FE and BE messages" waits on the owner's approval to edit Notion

- [x] Found: backend #202 (`5a3addb`) changed the spec during this branch, adding optional
      `startDate` and `endDate` to `GET /metric-logs/stats`, which the frontend does not call.
      `api:spec:check` failed → in scope by the owner's choice, as a separate commit: snapshot
      synced, types regenerated, CLAUDE.md's sync date moved

## Acceptance

- [x] No key outside the allowlist reaches the browser on a 4xx or a 5xx, `stack` included.
      _Why:_ F-20; the frontend stops depending on the backend's `NODE_ENV` check. · **jest**,
      `route.test.ts` (400 and 500 cases) and `proxy-error-body.test.ts`. Seen to fail with the
      filter call removed from `route.ts`: four route cases failed.
- [x] Every message the UI showed before still shows. _Why:_ a filter that drops a key the UI reads
      is its own failure mode (the todo's argument against). · **jest**, the five superset cases.
      Seen to fail with `errors` removed from the allowlist. · **Cypress**, `npm run test:e2e:stack`
      against the real backend: the wrong-password and validation copy still shows.
- [x] A body that is not a JSON object, or is over 64 KiB, is dropped and logged without its
      content. _Why:_ a gateway's page can carry internal addresses; an unbounded body is
      unbounded memory. · **jest**, the 502 and oversized route cases, and the `read-capped`
      cases. Seen to fail with the cap set to `Infinity`.
- [x] Success bodies and the proxy's own bodies are unchanged. _Why:_ the change is to error bodies
      only. · **jest**, the 200 case, the session-ending 401 case, and the existing suite (48
      route tests).

## Gates

Run 2026-10-21 on Node 24.21.0, against a production build with CI's environment and the local
backend at `5a3addb` (backend `dev`, running in `development`, so its error bodies carry a `stack`:
a direct `POST /auth/login` returned `message`, `stack` and `status`, and the same request through
the proxy returned `message` and `status`).

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage: 1114 tests; 56.78 / 46.91 / 51.2 / 56.28 %, every folder goal met
- [x] integration: 169 tests
- [x] spec drift: failed on backend #202, then in sync after the sync commit (33 paths);
      `api:types:check` in sync; `security:audit` clean
- [x] build
- [x] e2e and e2e (csp): 18 and 7 tests
- [x] e2e (stack) and e2e (csp, stack): 60 and 8 tests
