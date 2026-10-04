import type { LogEntry, LogSink } from "@/lib/logger";
import { writeToStdout } from "@/lib/logger";

import { scrubStrings, scrubText, stripQuery } from "./scrub";

/**
 * The two SDK calls the sink makes. Structural, so the sink is testable against
 * a fake and this file never imports the vendor package.
 */
export type ErrorReporter = {
  captureException: (error: unknown, hint?: CaptureHint) => unknown;
  captureMessage: (message: string, hint?: CaptureHint) => unknown;
};

type CaptureHint = {
  level?: "error";
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
};

type SinkOptions = {
  /** Injected in tests. */
  now?: () => number;
  write?: (entry: LogEntry) => void;
};

/** The log message the client-error route writes. */
export const CLIENT_ERROR_MSG = "client.error";

/**
 * Reports from the browser are unauthenticated, so a loop against the endpoint
 * would otherwise spend the Sentry quota. Past the cap they stay on stdout.
 *
 * It is a fixed window held in this process, which bounds abuse rather than
 * metering it: a burst straddling two windows gets through at twice the rate,
 * and each server process counts separately.
 */
export const CLIENT_REPORTS_PER_MINUTE = 30;

const WINDOW_MS = 60_000;
const MAX_TAG_LENGTH = 200;

/** Fields lifted out of the entry into searchable tags. */
const TAG_FIELDS = ["requestId", "digest", "kind", "routeType"] as const;

/** Fields that hold a URL or path and may carry a token in the query string. */
const URL_FIELDS = new Set(["path", "url"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Rebuild a server `Error` so Sentry renders a stack trace.
 *
 * By the time an entry reaches a sink, `redact` has turned any `Error` into a
 * plain `{ name, message, stack }` under `error`.
 *
 * Browser reports are not rebuilt. Their stack is in the browser's own format,
 * and the Node SDK parses only V8's, so Firefox and Safari reports would get no
 * frames while Chrome's did. They go as a message, with the stack in `extra`.
 */
const toError = (entry: LogEntry): Error | null => {
  if (!isRecord(entry.error)) return null;
  const { message, stack, name } = entry.error;
  if (typeof stack !== "string" || typeof message !== "string") return null;

  const error = new Error(scrubText(message));
  if (typeof name === "string") error.name = name;
  error.stack = scrubText(stack);
  return error;
};

const buildHint = (entry: LogEntry): CaptureHint => {
  const tags: Record<string, string> = { msg: entry.msg.slice(0, MAX_TAG_LENGTH) };
  for (const field of TAG_FIELDS) {
    const value = entry[field];
    if (typeof value === "string" && value) tags[field] = value.slice(0, MAX_TAG_LENGTH);
  }

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (key === "level" || key === "msg") continue;
    extra[key] =
      URL_FIELDS.has(key) && typeof value === "string" ? stripQuery(value) : scrubStrings(value);
  }

  return { level: "error", tags, extra };
};

/**
 * A `LogSink` that keeps the stdout event stream and forwards `error` entries.
 *
 * Stdout is written first and unconditionally: it is the provider-agnostic
 * record, and the fallback when the vendor is unreachable or over quota.
 * Forwarding never throws — monitoring must not break a request.
 */
export const createSentrySink = (reporter: ErrorReporter, options: SinkOptions = {}): LogSink => {
  const now = options.now ?? Date.now;
  const write = options.write ?? writeToStdout;

  let windowStart = 0;
  let clientReports = 0;

  const underClientCap = (): boolean => {
    const time = now();
    if (time - windowStart >= WINDOW_MS) {
      windowStart = time;
      clientReports = 0;
    }
    clientReports += 1;
    return clientReports <= CLIENT_REPORTS_PER_MINUTE;
  };

  return (entry) => {
    write(entry);

    if (entry.level !== "error") return;
    if (entry.msg === CLIENT_ERROR_MSG && !underClientCap()) return;

    try {
      const hint = buildHint(entry);
      const error = toError(entry);
      if (error) {
        reporter.captureException(error, hint);
      } else {
        // A message has no stack of its own to group by, so say how to group it:
        // by event, kind and text. Left to itself the SDK groups every message
        // sent from this line into one issue.
        const message = typeof entry.message === "string" ? scrubText(entry.message) : "";
        const fingerprint = [entry.msg, hint.tags?.kind ?? "", message];
        reporter.captureMessage(message ? `${entry.msg}: ${message}` : entry.msg, {
          ...hint,
          fingerprint,
        });
      }
    } catch {
      // The entry is already on stdout; a failed forward is not worth a second line.
    }
  };
};
