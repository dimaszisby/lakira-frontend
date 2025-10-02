import type { AxiosError } from "axios";
import axios from "axios";

import { isAbortError } from "./isAbortError";

export type NormalizedApiError = {
  isAbort: boolean;
  status?: number;
  code?: string; // e.g., ERR_CANCELED, ECONNABORTED
  title: string; // short classification
  messages: string[]; // user-facing messages
  retryable: boolean; // hint for retries/backoff
  raw?: unknown; // original error for telemetry
};

// small type guards (no `any`)
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}
function getArray(obj: Record<string, unknown>, key: string): unknown[] | undefined {
  const v = obj[key];
  return Array.isArray(v) ? v : undefined;
}

// Extract messages from common API envelopes without `any`
function extractMessages(data: unknown): string[] | null {
  if (!isRecord(data)) return null;

  const msgs: string[] = [];

  // { message?: string }
  const single = getString(data, "message");
  if (single) msgs.push(single);

  // { errors?: string[] | { message: string }[] }
  const errorsArr = getArray(data, "errors");
  if (errorsArr) {
    for (const item of errorsArr) {
      if (typeof item === "string") {
        msgs.push(item);
      } else if (isRecord(item)) {
        const m = getString(item, "message");
        if (m) msgs.push(m);
      }
    }
  }

  // { error?: string }
  const errorSingle = getString(data, "error");
  if (errorSingle) msgs.push(errorSingle);

  // Zod-like: { issues: [{ message: string }] }
  const issues = getArray(data, "issues");
  if (issues) {
    for (const it of issues) {
      if (isRecord(it)) {
        const m = getString(it, "message");
        if (m) msgs.push(m);
      }
    }
  }

  return msgs.length ? msgs : null;
}

function titleFrom(status?: number, code?: string): string {
  if (code === "ERR_CANCELED") return "Canceled";
  if (status == null) return "Network error";
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not Found";
  if (status === 409) return "Conflict";
  if (status === 422) return "Validation error";
  if (status === 429) return "Rate limited";
  if (status >= 500) return "Server error";
  return "Request error";
}

function computeRetryable(status?: number, code?: string): boolean {
  if (code === "ERR_CANCELED") return false;
  if (status == null) return true; // network/CORS/timeouts → often retryable
  if (status === 429) return true; // backoff and retry
  return status >= 500; // 5xx → retry by default
}

export function normalizeApiError(err: unknown): NormalizedApiError {
  // Cancellations (AbortController / Axios)
  if (isAbortError(err)) {
    return {
      isAbort: true,
      title: "Canceled",
      messages: [],
      retryable: false,
      raw: err,
    };
  }

  // Axios-shaped errors
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<unknown>;
    const status = e.response?.status;
    const code = e.code;
    const data = e.response?.data;

    const messages = extractMessages(data) ?? (e.message ? [e.message] : ["Request failed"]);

    return {
      isAbort: false,
      status,
      code,
      title: titleFrom(status, code),
      messages,
      retryable: computeRetryable(status, code),
      raw: err,
    };
  }

  // Non-Axios errors
  const msg = err instanceof Error ? err.message : "Unexpected error";
  return {
    isAbort: false,
    title: "Unexpected error",
    messages: [msg],
    retryable: false,
    raw: err,
  };
}
