import { redact, REDACTED, SENSITIVE_KEY_PATTERN } from "@/lib/logger";
import { scrubText, stripQuery } from "@/lib/scrub-text";

// The text functions live in a leaf module so the logger can use them too.
export { scrubText, stripQuery };

/**
 * The parts of a Sentry event this scrubber touches. Structural rather than
 * importing Sentry's own event type, so an SDK bump cannot silently change what
 * is scrubbed. `lakira-backend` does the same in `src/utils/sentry-scrub.ts`.
 */
export type ScrubbableEvent = {
  message?: string;
  exception?: { values?: { value?: string }[] };
  request?: {
    url?: string;
    headers?: Record<string, string>;
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
  };
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
};

/** {@link scrubText} over every string in a value. Bounded by `redact`'s own depth cap. */
export const scrubStrings = (value: unknown): unknown => {
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map(scrubStrings);
  if (typeof value !== "object" || value === null) return value;

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) out[key] = scrubStrings(item);
  return out;
};

const redactHeaders = (headers: Record<string, string>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : value;
  }
  return out;
};

/**
 * Strips credentials from a Sentry event before it leaves the process.
 *
 * `sendDefaultPii` is false, so the SDK attaches no headers, cookies or bodies
 * by itself. This covers what application code passes explicitly, and anything
 * a future integration adds.
 */
export const scrubSentryEvent = <T extends ScrubbableEvent>(event: T): T => {
  if (event.message) event.message = scrubText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
  }
  if (event.request) {
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    if (event.request.headers) event.request.headers = redactHeaders(event.request.headers);
    // Cookies are never useful in a stack trace and always carry the session.
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.data !== undefined) event.request.data = redact(event.request.data);
  }
  if (event.extra) event.extra = scrubStrings(redact(event.extra)) as Record<string, unknown>;
  if (event.contexts) event.contexts = redact(event.contexts) as Record<string, unknown>;
  return event;
};
