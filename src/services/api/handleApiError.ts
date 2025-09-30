import {
  normalizeApiError,
  type NormalizedApiError,
} from "./normalizeApiError";

type HandleOptions = {
  toast?: (msg: string) => void; // Dev Note: optional UI hook, currently not being used yet
  telemetry?: (n: NormalizedApiError) => void;
  quietStatuses?: number[]; // e.g., [404]
};

export const handleApiError = (
  error: unknown,
  opts: HandleOptions = {}
): string[] => {
  const n = normalizeApiError(error);

  // Ignore cancellations completely
  if (n.isAbort) return [];

  // IF: skip noisy statuses from UI (but still log to dev console)
  const shouldQuiet =
    n.status && opts.quietStatuses?.includes(n.status as number);

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
  return n.messages.length ? n.messages : [n.title];
};
