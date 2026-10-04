/**
 * Reports a browser error to the app's own endpoint, which logs it on the
 * server. No vendor code runs in the browser (ADR-0024); whatever sink the
 * server has registered decides where the report goes next.
 *
 * Reporting must never make things worse: every path here is best-effort and
 * swallows its own failures.
 */

const ENDPOINT = "/api/observability/client-error";

/** A broken page can throw on every render or tick; a handful of reports is enough. */
export const MAX_REPORTS_PER_PAGE_LOAD = 5;

const MAX_MESSAGE_LENGTH = 1_024;
const MAX_STACK_LENGTH = 4_000;
const MAX_ID_LENGTH = 128;

export type ClientErrorKind = "boundary" | "uncaught" | "unhandled-rejection";

let sent = 0;
const seen = new Set<string>();

/** Test hook: the counters live for the life of the page. */
export const resetClientErrorReports = (): void => {
  sent = 0;
  seen.clear();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value ? value.slice(0, max) : undefined;

/**
 * The backend's request id, when the error is a failed API call.
 *
 * Read structurally from an Axios-shaped error (`response.headers`) or an
 * already-normalized one (`requestId`), so this file needs neither import.
 */
const requestIdOf = (error: unknown): string | undefined => {
  if (!isRecord(error)) return undefined;
  const direct = text(error.requestId, MAX_ID_LENGTH);
  if (direct) return direct;

  const { response } = error;
  if (!isRecord(response) || !isRecord(response.headers)) return undefined;
  return text(response.headers["x-request-id"], MAX_ID_LENGTH);
};

/** Requests cancelled on purpose are not errors. */
const isCancellation = (error: unknown): boolean =>
  isRecord(error) && (error.name === "AbortError" || error.name === "CanceledError");

export const reportClientError = (error: unknown, kind: ClientErrorKind): void => {
  if (typeof window === "undefined") return;
  if (isCancellation(error)) return;

  try {
    const source = isRecord(error) ? error : {};
    const message =
      text(source.message, MAX_MESSAGE_LENGTH) ??
      text(error, MAX_MESSAGE_LENGTH) ??
      "Unknown error";
    const stack = text(source.stack, MAX_STACK_LENGTH);

    const digest = text(source.digest, MAX_ID_LENGTH);

    // A boundary and the window listener can both see one failure. The digest
    // identifies a server-rendered error whatever shape its message arrives in.
    const signature = digest ?? `${message}\n${stack?.split("\n", 2).join("\n") ?? ""}`;
    if (seen.has(signature) || sent >= MAX_REPORTS_PER_PAGE_LOAD) return;
    seen.add(signature);
    sent += 1;

    const body = JSON.stringify({
      kind,
      message,
      stack,
      digest,
      requestId: requestIdOf(error),
      // `pathname` carries no query string, so no reset or invite token.
      path: window.location.pathname,
    });

    void fetch(ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => undefined);
  } catch {
    // Nothing useful to do with a failure to report a failure.
  }
};
