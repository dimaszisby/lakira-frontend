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
 */

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

export const REDACTED = "[redacted]";

/** Guard against cycles and pathological nesting in untrusted payloads. */
const MAX_DEPTH = 6;

/**
 * Deep-copy `value`, replacing any sensitive field with {@link REDACTED}.
 *
 * Errors are converted to a plain object, because `JSON.stringify(new Error())`
 * yields `{}` and would silently drop the message and stack.
 */
export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return "[max depth]";
  if (value === null || typeof value !== "object") return value;

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(item, depth + 1);
  }
  return out;
};

let sink: LogSink | null = null;

/**
 * Register a destination for log entries, e.g. an error-monitoring adapter.
 * Passing `null` restores the default stdout writer.
 */
export const setLogSink = (next: LogSink | null): void => {
  sink = next;
};

const writeEntry = (entry: LogEntry): void => {
  if (sink) {
    sink(entry);
    return;
  }

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
