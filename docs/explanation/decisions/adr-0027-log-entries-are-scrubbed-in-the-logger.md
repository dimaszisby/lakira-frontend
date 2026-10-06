# ADR-0027 — Log entries are scrubbed in the logger, before any sink sees them

- **Status:** Accepted
- **Date:** 2026-10-06
- **Origin:** `D-01` in the telemetry-log-hardening kit — [`decisions.md`](../../internal/initiatives/telemetry-log-hardening/decisions.md)

---

## Context

The logger writes one JSON line per entry to stdout and can forward entries to a sink
([ADR-0024](./adr-0024-sentry-on-the-server-only.md)). Until 2026-10-06 it redacted by key name
only. Free text was scrubbed by pattern, but inside the Sentry sink, so the stdout line carried
whatever the text held. The 2026-10-04 readiness audit found an email address there (finding N7).
A log drain ships stdout, so that text reached a second destination unscrubbed.

Stdout is written first and unconditionally. It is the record that exists with no vendor
configured, which makes it the copy least able to rely on a vendor-side scrubber.

## Decision

`redact` in `src/lib/logger.ts` scrubs as well as redacts, and `log()` passes every entry through
it at every level:

- Every string value goes through `scrubText`: email addresses, bearer values, token-shaped
  strings and `?key=value` queries are removed.
- A value under a `path` or `url` key loses its query string and fragment.
- An `Error` keeps its name; its message and stack are scrubbed.
- A string is cut at `MAX_STRING_LENGTH` (4,096 characters) before it is scrubbed, because the
  patterns run on every string and their cost has to be bounded in one place (kit `D-03`).

The text functions live in `src/lib/scrub-text.ts`, a module that imports nothing, so the logger
and `src/lib/monitoring/scrub.ts` can both use them without a cycle. The Sentry sink keeps its own
pass; it is idempotent on scrubbed text.

## Options considered

- **Scrub in the stdout writer.** It fixes stdout and leaves every other sink to remember.
- **Scrub named fields only.** A new field is unscrubbed until someone lists it. The CSP report's
  page address was such a field, and it is the one most likely to hold a reset token.
- **Move `redact` into the monitoring folder.** The logger has to work with no monitoring code
  loaded.

## Consequences

- A log line is not the literal text it was given. An address reads `[email]`, a token
  `[redacted]`, and a long string ends in `...`. Do not log a value that has to be read back
  exactly unless it is an identifier the patterns leave alone.
- `scrubSentryEvent` calls `redact` on request data, `extra` and `contexts`, so those are scrubbed
  by pattern on the way to Sentry as well. Before, only keys were redacted there.
- Scrubbing by pattern is a net, not a guarantee, and the cut happens before scrubbing, so a value
  that straddles it can survive in part. The rule in `.claude/rules/security.md` stands: log
  identifiers, never user input, and never a URL with its query string.
- A pattern added to `scrubText` runs on every log line. Measure it on a worst-case string of
  4,096 characters first; a regression test bounds the address pattern on 200 KB.
- The message name passed as `msg` is not scrubbed. It is a constant written by the developer.

## References

- [`../../internal/audits/saas-readiness/audit-2026-10-04.md`](../../internal/audits/saas-readiness/audit-2026-10-04.md) § 6, N7
- [ADR-0024](./adr-0024-sentry-on-the-server-only.md) — the sink this entry is forwarded to
- [`../../internal/initiatives/telemetry-log-hardening/`](../../internal/initiatives/telemetry-log-hardening/)
