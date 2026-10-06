/**
 * Scrubbing for free text: an error message, a stack trace, a URL.
 *
 * A leaf on purpose. `src/lib/logger.ts` scrubs every entry with it and
 * `src/lib/monitoring/scrub.ts` builds on the logger, so anything imported here
 * would close a cycle between the two.
 */

export const REDACTED = "[redacted]";

/**
 * Drop the query string and fragment from a URL or path.
 *
 * `/reset-password?token=…` and `/invites/accept?token=…` carry a live
 * credential in the URL, and key-based redaction cannot see inside a string.
 */
export const stripQuery = (value: string): string => {
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
};

// Not followed by `:digit`: Firefox and Safari write a stack frame as
// `function@file.js:line:column`, which is otherwise shaped like an address.
//
// The lookbehind changes no match: an address always starts at the first
// character of its run. It is there so a long run with no `@` is tried once
// rather than once per character, which took 196 ms on 16 KB.
const EMAIL = /(?<![A-Z0-9._%+-])[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?!:\d)/gi;
const BEARER = /\bBearer\s+[\w.~+/-]+=*/gi;
const JWT = /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]*/g;
// A `?key=value` query inside free text. Values stop at a colon so a stack
// frame's `:line:column` suffix survives (`chunk.js?v=1:10:20`).
const QUERY_IN_TEXT = /\?[\w.%~-]+=[^\s"'<>):]*(?:&[\w.%~-]+=[^\s"'<>):]*)*/g;

/**
 * Scrub free text: an error message, a stack trace.
 *
 * Key-based redaction never looks inside a value, and these are exactly the
 * values that carry what a user typed or a URL they were on. A browser report
 * is also written entirely by the caller.
 */
export const scrubText = (value: string): string =>
  value
    .replace(JWT, REDACTED)
    .replace(BEARER, `Bearer ${REDACTED}`)
    .replace(QUERY_IN_TEXT, "")
    .replace(EMAIL, "[email]");
