import { isRecord, numberOrUndef } from "@/src/utils/type-guards";

/**
 * Extract an HTTP status code from common error shapes
 * (Axios-like: err.response.status, Fetch/adapters: err.status).
 * Transport-agnostic on purpose.
 */
export const httpStatusFrom = (err: unknown): number | undefined => {
  if (!isRecord(err)) return undefined;

  // Direct .status on error
  const direct = numberOrUndef(err.status);
  if (direct != null) return direct;

  // Nested .response.status (Axios, some adapters)
  const resp = isRecord(err.response) ? err.response : undefined;
  return resp ? numberOrUndef((resp as Record<string, unknown>).status) : undefined;
};
