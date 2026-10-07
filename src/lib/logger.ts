/**
 * Structured server-side logging, written to stdout as an event stream.
 *
 * The app deliberately does **not** depend on a monitoring vendor. Logs are
 * emitted as one JSON object per line on stdout, which every host (Vercel,
 * Docker, a plain process manager) already collects. To ship them somewhere,
 * point a log drain at the process — or implement `LogSink` and register it
 * with {@link setLogSink}, which is the seam an APM adapter plugs into.
 *
 * `lakira-backend` made the same choice; see its "write logs to stdout as an
 * event stream" change.
 *
 * ## Redaction
 *
 * Every field is walked and any key that looks sensitive is replaced before the
 * entry is serialised. The pattern below is **substring-matched, not
 * suffix-anchored**. The backend's equivalent is anchored with `$`, which means
 * it silently misses `authorization`, `cookie`, `bearer` and `dsn` — a gap
 * logged as caveat C6 in its own audit. Do not copy that shape.
 *
 * Key names say nothing about what a value holds, so every string is also
 * passed through `scrubText`, which removes addresses, bearer values, token
 * shapes and `?key=value` queries. It happens here rather than in a sink so
 * that stdout, and whatever a log drain ships from it, is covered too: until
 * 2026-10-06 only the copy sent to Sentry was scrubbed.
 */

import { REDACTED, scrubText, stripQuery } from "@/lib/scrub-text";

export { REDACTED };

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  msg: string;
  time: string;
  [field: string]: unknown;
}

/** A destination for log entries. Implement this to forward to an APM. */
export type LogSink = (entry: LogEntry) => void;

/**
 * Keys whose values must never be logged.
 *
 * Substring match, case-insensitive. Anchoring this to the end of the key is
 * the mistake that lets `authorization` and `cookie` through.
 */
export const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|bearer|password|passwd|secret|token|api[-_]?key|apikey|credential|session|signature|private[-_]?key|dsn|otp|passcode)/i;

/** Guard against cycles and pathological nesting in untrusted payloads. */
const MAX_DEPTH = 6;

/**
 * No single string is logged past this. The scrubbing patterns run on every
 * string, and one of them is quadratic on crafted input, so the length a caller
 * can reach them with has to be bounded here rather than at each call site.
 */
export const MAX_STRING_LENGTH = 4_096;

const scrubString = (value: string): string =>
  scrubText(value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value);

/** Fields that hold a URL or path and may carry a token in the query string. */
const URL_KEYS = new Set(["path", "url"]);

const redactField = (key: string, item: unknown, depth: number): unknown => {
  if (SENSITIVE_KEY_PATTERN.test(key)) return REDACTED;
  if (URL_KEYS.has(key) && typeof item === "string") return scrubString(stripQuery(item));
  return redact(item, depth + 1);
};

/**
 * Deep-copy `value`, replacing any sensitive field with {@link REDACTED} and
 * scrubbing every string on the way.
 *
 * Errors are converted to a plain object, because `JSON.stringify(new Error())`
 * yields `{}` and would silently drop the message and stack.
 */
export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return "[max depth]";
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubString(value.message),
      stack: value.stack === undefined ? undefined : scrubString(value.stack),
    };
  }

  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = redactField(key, item, depth);
  }
  return out;
};

/**
 * The registered sink lives on `globalThis`, not in a module variable.
 *
 * Next bundles this file into each server chunk that imports it, and every
 * copy gets its own module scope. `src/instrumentation.ts` registers the sink
 * from one copy; a route handler logs through another. With a module variable
 * the route's copy never saw the sink, so its entries reached stdout and went
 * no further. Found on 2026-10-04 by sending real errors: the one logged from
 * the instrumentation chunk arrived in Sentry, the two from a route did not.
 * `Symbol.for` is what makes every copy resolve the same slot.
 */
const SINK_KEY = Symbol.for("lakira.logger.sink");

type SinkRegistry = { [SINK_KEY]?: LogSink | null };

const registry = globalThis as SinkRegistry;

/**
 * Register a destination for log entries, e.g. an error-monitoring adapter.
 * Passing `null` restores the default stdout writer.
 */
export const setLogSink = (next: LogSink | null): void => {
  registry[SINK_KEY] = next;
};

/**
 * The default writer: one JSON object per line. Exported so a sink can keep the
 * event stream intact and forward on top of it, rather than replace it.
 */
export const writeToStdout = (entry: LogEntry): void => {
  const line = JSON.stringify(entry);

  // Node: one JSON object per line on stdout, the twelve-factor event stream.
  // `process.stdout` is absent in the Edge runtime and in the browser, so fall
  // back to the two console methods `no-console` permits.
  if (typeof process !== "undefined" && process.stdout?.write) {
    process.stdout.write(`${line}\n`);
  } else if (entry.level === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
};

const writeEntry = (entry: LogEntry): void => {
  const sink = registry[SINK_KEY];
  if (sink) {
    sink(entry);
    return;
  }

  writeToStdout(entry);
};

export const log = (level: LogLevel, msg: string, fields: LogFields = {}): void => {
  // Client bundles must not emit server-shaped logs; a browser console is not a
  // log drain, and the fields often describe server state.
  if (typeof window !== "undefined") return;

  if (level === "debug" && process.env.NODE_ENV === "production") return;

  writeEntry({
    level,
    msg,
    time: new Date().toISOString(),
    ...(redact(fields) as LogFields),
  });
};

export const logger = {
  debug: (msg: string, fields?: LogFields) => log("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => log("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => log("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => log("error", msg, fields),
};
