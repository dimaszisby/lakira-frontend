import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";

import type { NormalizedApiError } from "./normalizeApiError";
import { normalizeApiError } from "./normalizeApiError";

const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  401: "Your session expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "We couldn't find what you're looking for.",
  429: "Too many attempts. Try again in a moment.",
};

function friendlyMessageFor(error: NormalizedApiError): string | null {
  if (error.status && FRIENDLY_STATUS_MESSAGES[error.status]) {
    return FRIENDLY_STATUS_MESSAGES[error.status];
  }

  if (error.status != null && error.status >= 500) {
    return "Something went wrong on our side. Please try again later.";
  }

  if (error.status == null) {
    return "We couldn't reach the server. Check your connection and try again.";
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

  const friendly = friendlyMessageFor(n);
  if (friendly) {
    return [friendly];
  }

  return sanitizedMessages;
};
