# ADR-0029 — The server's `console.error` output is scrubbed

- **Status:** Accepted
- **Date:** 2026-10-11
- **Origin:** finding N7 of the 2026-10-10 readiness audit — [`2026-10-10-todo-reaudit-findings.md`](../../internal/todos/2026-10-10-todo-reaudit-findings.md)

---

## Context

[ADR-0027](./adr-0027-log-entries-are-scrubbed-in-the-logger.md) scrubs every entry the
application's logger writes. The 2026-10-10 audit threw an error from a Server Component with an
email address, a `?token=` query and a bearer value in its message. The logger's
`server.request_error` line was scrubbed. Next printed the same error itself, with all three
intact, and a log drain receives both.

Next writes that line after it calls the application's `onRequestError`
(`next/dist/server/next-server.js`, `instrumentationOnRequestError`): `logError(err)`, which is
`console.error` with a `⨯` prefix. In Next 16.3.8 it is skipped only when the server's `quiet`
option is set. `quiet` exists on a custom server (`next({ quiet: true })`) and nowhere else:
`next start` has no flag for it and `next.config` has no key.

The line goes to stderr. The audit called it stdout; a drain ships both streams.

## Decision

`scrubConsoleErrors` in `src/lib/monitoring/console-scrub.ts` replaces `console.error` in the
server process, and `register()` in `src/instrumentation.ts` calls it in the Node runtime before
anything else, whether or not a monitoring DSN is set.

- The wrapper formats its arguments into one string with `node:util`'s `format`, which is how
  `console.error` builds its line apart from colour on a terminal, and passes that string through
  `redact` from `src/lib/logger.ts`. So the same patterns run (`scrubText`) and the same
  4,096-character cut applies.
- If an argument throws while it is formatted, the wrapper prints a fixed placeholder. It never
  falls back to the raw arguments, and it never throws into the code that was logging.
- The value that was thrown is not touched. It continues to `onRequestError` and to the sink as it
  was.
- It installs once per process. The marker is a `Symbol.for` slot on `globalThis`, for the reason
  the logger's sink is: Next bundles a module into several chunks.
- It installs in production only.

## Options considered

- **A custom server with `quiet: true`.** The one supported switch. It replaces `next start`, which
  the Next documentation says to do only when the integrated router cannot meet the app's needs,
  and a custom server cannot be used with standalone output. It would fix how the app is deployed
  before hosting is decided. It also silences the line; it does not scrub it.
- **Document the gap and change nothing.** The honest fallback if the wrapper had not worked. It
  leaves a credential in a reset link one thrown error away from the log drain.
- **Scrub in a wrapper around `process.stderr.write`.** It would catch more, but it sits under
  every write the process makes, including ones that are not text lines, and it would scrub the
  logger's fallback output twice at a lower level than anything else in the app works at.
- **Mutate the error's message before Next prints it.** `onRequestError` runs first, so it could.
  The same object is what the error boundary and the sink receive; changing it changes what they
  see, and a frozen or foreign error cannot be changed at all.

## Consequences

- Whatever the server prints with `console.error` is one scrubbed string. An object argument is
  printed as `util.format` renders it, not as a live object. A line past 4,096 characters ends in
  `...`, so a very deep stack is cut. No colour is applied on a terminal.
- The cut happens before the scrub, on the whole line, message and stack together. A value that
  straddles character 4,096 is cut in half and its first part can survive, as ADR-0027 already
  says of a single field. Scrubbing first would lift the bound on what the patterns run on, which
  is what the cut is for.
- Only `console.error`. `console.warn`, `console.log` and a dependency that writes to
  `process.stdout` or `process.stderr` directly are not covered.
- It depends on Next printing the error with `console.error`. A Next upgrade can change that
  without a type error or a failing unit test. The check is a probe: a Server Component that throws
  a message holding an address and a token, on a production build, and both output streams read.
- Development is unchanged. Next prints through its own path there, and a flattened string would
  make a local stack trace harder to read.
- It is a global patch on the server's console. Anything else that replaces `console.error` after
  `register()` runs wraps this wrapper, which is harmless; anything that restores a saved original
  would remove it.
- Scrubbing by pattern is a net, not a guarantee, as ADR-0027 says. The rule stands: do not put
  user input or a URL with its query string in an error message.

## References

- [ADR-0027](./adr-0027-log-entries-are-scrubbed-in-the-logger.md) — the logger's scrub, which this reuses
- [`../../internal/audits/saas-readiness/audit-2026-10-10.md`](../../internal/audits/saas-readiness/audit-2026-10-10.md) § 6, "N7, what is left"
- `node_modules/next/dist/docs/01-app/02-guides/custom-server.md` — the `quiet` option
