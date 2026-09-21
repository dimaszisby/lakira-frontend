import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";

import type { NormalizedApiError } from "./normalizeApiError";
import { normalizeApiError } from "./normalizeApiError";

const SESSION_EXPIRED_MESSAGE = "Your session expired. Please log in again.";

/**
 * Keyed on a `code` the server chose, so it beats anything inferred from status.
 *
 * `SESSION_EXPIRED` is issued by `src/app/api/proxy/[...path]/route.ts` for the
 * two cases only it can tell apart: no session cookie at all, and a cookie whose
 * token refresh could not rescue. A bare 401 status cannot distinguish either
 * from "that password was wrong".
 */
const FRIENDLY_CODE_MESSAGES: Record<string, string> = {
  SESSION_EXPIRED: SESSION_EXPIRED_MESSAGE,
};

/**
 * Fallbacks for when the server said nothing useful — **not** overrides.
 *
 * 401 is still here because Axios fills `messages` with "Request failed with
 * status code 401" when the envelope is empty, and that must not reach a user.
 * It is now reached only when `hasServerMessage` is false.
 */
const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  401: SESSION_EXPIRED_MESSAGE,
  403: "You don't have permission to perform this action.",
  404: "We couldn't find what you're looking for.",
  429: "Too many attempts. Try again in a moment.",
};

/**
 * Cases where the server's own text must never be shown.
 *
 * `sanitizeErrorMessage` truncates and strips control characters and angle
 * brackets; it does not redact. A 5xx body can carry a connection string, a
 * query or a stack frame, so this override is load-bearing rather than cosmetic.
 * A missing status means no response arrived, so there is nothing to show.
 */
function overrideMessageFor(error: NormalizedApiError): string | null {
  if (error.status == null) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  if (error.status >= 500) {
    return "Something went wrong on our side. Please try again later.";
  }

  return null;
}

type HandleOptions = {
  toast?: (msg: string) => void; // Dev Note: optional UI hook, currently not being used yet
  telemetry?: (n: NormalizedApiError) => void;
  quietStatuses?: number[]; // e.g., [404]
};

export const handleApiError = (error: unknown, opts: HandleOptions = {}): string[] => {
  const n = normalizeApiError(error);

  // Ignore cancellations completely
  if (n.isAbort) return [];

  // IF: skip noisy statuses from UI (but still log to dev console)
  const shouldQuiet = n.status && opts.quietStatuses?.includes(n.status as number);

  // Dev console
  if (process.env.NODE_ENV !== "production") {
    console.error("[API ERROR]", {
      status: n.status,
      code: n.code,
      title: n.title,
      messages: n.messages,
      retryable: n.retryable,
      raw: n.raw,
    });
  }

  // Telemetry (non-cancel only)
  if (opts.telemetry) opts.telemetry(n);

  // IF: toast for the top message
  if (opts.toast && !shouldQuiet) {
    const msg = n.messages[0] ?? n.title;
    if (msg) opts.toast(msg);
  }

  // Preserve the function’s return contract
  const sanitizedMessages = n.messages.length
    ? n.messages.map((msg) => sanitizeErrorMessage(msg))
    : [sanitizeErrorMessage(n.title)];

  // Precedence, most specific first. This used to be one step — the status map,
  // applied unconditionally — which meant a wrong password rendered as "Your
  // session expired. Please log in again." on the login page, discarding the
  // "Invalid email or password" the backend had already sent.
  //
  // 1. A code the server chose. It knows why, and nothing here has to guess.
  if (n.serverCode && FRIENDLY_CODE_MESSAGES[n.serverCode]) {
    return [FRIENDLY_CODE_MESSAGES[n.serverCode]];
  }

  // 2. Cases where the server's text must not be shown at all.
  const override = overrideMessageFor(n);
  if (override) {
    return [override];
  }

  // 3. The server said something specific. Prefer it.
  if (n.hasServerMessage) {
    return sanitizedMessages;
  }

  // 4. It did not, so fall back to copy keyed on the status.
  if (n.status && FRIENDLY_STATUS_MESSAGES[n.status]) {
    return [FRIENDLY_STATUS_MESSAGES[n.status]];
  }

  return sanitizedMessages;
};
